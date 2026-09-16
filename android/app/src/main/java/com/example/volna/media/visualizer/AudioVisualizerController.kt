package com.example.volna.media.visualizer

import android.media.audiofx.Visualizer
import android.util.Log
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlin.math.abs
import kotlin.math.hypot

class AudioVisualizerController {

    private var visualizer: Visualizer? = null
    private val _amplitudes = MutableStateFlow<FloatArray>(FloatArray(32) { 0f })
    val amplitudes: StateFlow<FloatArray> = _amplitudes.asStateFlow()

    private var smoothedData = FloatArray(32) { 0f }
    private var isSimulated = false

    /**
     * Инициализирует аппаратный Visualizer для заданного audioSessionId.
     * При отсутствии прав или аппаратных ограничениях переключается в fallback-режим.
     */
    fun attachToAudioSession(audioSessionId: Int, barsCount: Int = 32) {
        release()
        smoothedData = FloatArray(barsCount) { 0f }

        if (audioSessionId <= 0) {
            enableFallbackMode(barsCount)
            return
        }

        try {
            val v = Visualizer(audioSessionId)
            v.captureSize = Visualizer.getCaptureSizeRange()[1].coerceAtMost(1024)
            v.setDataCaptureListener(
                object : Visualizer.OnDataCaptureListener {
                    override fun onWaveFormDataCapture(
                        visualizer: Visualizer?,
                        waveform: ByteArray?,
                        samplingRate: Int
                    ) {
                        // Используем FFT для спектра, waveform для волны
                    }

                    override fun onFftDataCapture(
                        visualizer: Visualizer?,
                        fft: ByteArray?,
                        samplingRate: Int
                    ) {
                        if (fft == null) return
                        processFft(fft, barsCount)
                    }
                },
                Visualizer.getMaxCaptureRate() / 2,
                false,
                true
            )
            v.enabled = true
            visualizer = v
            isSimulated = false
        } catch (e: Exception) {
            Log.w("AudioVisualizer", "Cannot attach hardware visualizer: ${e.message}. Using fallback.")
            enableFallbackMode(barsCount)
        }
    }

    private fun processFft(fft: ByteArray, barsCount: Int) {
        val n = fft.size
        val bands = FloatArray(barsCount)
        val step = (n / 2) / barsCount

        for (i in 0 until barsCount) {
            val index = (i * step * 2).coerceIn(0, n - 2)
            val real = fft[index].toFloat()
            val imag = fft[index + 1].toFloat()
            val magnitude = hypot(real, imag) / 128f
            bands[i] = magnitude.coerceIn(0f, 1f)
        }

        // Экспоненциальное сглаживание (EMA) для плавности
        val alpha = 0.25f
        for (i in 0 until barsCount) {
            smoothedData[i] = smoothedData[i] * (1 - alpha) + bands[i] * alpha
        }
        _amplitudes.value = smoothedData.copyOf()
    }

    private fun enableFallbackMode(barsCount: Int) {
        isSimulated = true
        // В симулированном режиме генерируются плавные гармоники
        smoothedData = FloatArray(barsCount) { 0.1f }
        _amplitudes.value = smoothedData.copyOf()
    }

    /**
     * Вызывается при воспроизведении в режиме анимации/fallback
     */
    fun updateFallbackFrame(progressNormalized: Float, isPlaying: Boolean, sensitivity: Float = 1.0f) {
        if (!isSimulated || !isPlaying) {
            if (!isPlaying) {
                // Затухание
                for (i in smoothedData.indices) {
                    smoothedData[i] = smoothedData[i] * 0.85f
                }
                _amplitudes.value = smoothedData.copyOf()
            }
            return
        }

        val barsCount = smoothedData.size
        val time = System.currentTimeMillis() / 200.0
        val result = FloatArray(barsCount)

        for (i in 0 until barsCount) {
            val freq = (i + 1) * 0.4
            val raw = (Math.sin(time + freq) * 0.4 + Math.cos(time * 0.7 + i) * 0.3 + 0.5).toFloat()
            val target = (raw * sensitivity).coerceIn(0.05f, 1.0f)
            smoothedData[i] = smoothedData[i] * 0.7f + target * 0.3f
            result[i] = smoothedData[i]
        }
        _amplitudes.value = result
    }

    fun release() {
        try {
            visualizer?.enabled = false
            visualizer?.release()
        } catch (e: Exception) {
            e.printStackTrace()
        }
        visualizer = null
    }
}

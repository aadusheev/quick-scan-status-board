
import { useCallback } from 'react';

interface VoiceAnnouncementOptions {
  volume?: number;
  rate?: number;
  pitch?: number;
}

export const useVoiceAnnouncement = (options: VoiceAnnouncementOptions = {}) => {
  const { volume = 1, rate = 1, pitch = 1 } = options;

  const speak = useCallback((text: string) => {
    // Проверяем поддержку Speech Synthesis API
    if (!('speechSynthesis' in window)) {
      console.warn('Speech Synthesis API не поддерживается в этом браузере');
      return;
    }

    // Отменяем все текущие голосовые сообщения
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.volume = volume;
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.lang = 'ru-RU'; // Русский язык

    // Логируем голосовое сообщение
    console.log('Воспроизводится голосовое сообщение:', text);

    speechSynthesis.speak(utterance);
  }, [volume, rate, pitch]);

  const playErrorSound = useCallback(() => {
    // Создаем аудио контекст для воспроизведения звука ошибки
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Настройки для звука ошибки
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(400, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
      oscillator.frequency.setValueAtTime(400, audioContext.currentTime + 0.3);

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.4);

      console.log('Воспроизводится звук ошибки');
    } catch (error) {
      console.warn('Не удалось воспроизвести звук ошибки:', error);
    }
  }, []);

  const announceStatus = useCallback((status: string) => {
    const normalizedStatus = status.toLowerCase().trim();
    
    if (normalizedStatus === 'допущенные' || normalizedStatus === 'допущен' || normalizedStatus.includes('допущ') || normalizedStatus === '0') {
      speak('ОК');
    } else if (normalizedStatus === 'недопущенные' || normalizedStatus === 'недопущен' || normalizedStatus.includes('недопущ') ||
               normalizedStatus === 'перелимит' || normalizedStatus.includes('перелимит') ||
               normalizedStatus === 'досмотр' || normalizedStatus.includes('досмотр') ||
               normalizedStatus === 'излишки') {
      playErrorSound();
    }
  }, [speak, playErrorSound]);

  return { speak, announceStatus };
};

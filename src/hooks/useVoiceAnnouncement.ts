
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

  const announceStatus = useCallback((status: string) => {
    const normalizedStatus = status.toLowerCase().trim();
    
    let message = '';
    
    if (normalizedStatus === 'допущенные' || normalizedStatus === 'допущен' || normalizedStatus.includes('допущ') || normalizedStatus === '0') {
      message = 'ОК';
    } else if (normalizedStatus === 'недопущенные' || normalizedStatus === 'недопущен' || normalizedStatus.includes('недопущ')) {
      message = 'недопущено';
    } else if (normalizedStatus === 'перелимит' || normalizedStatus.includes('перелимит')) {
      message = 'перелимит';
    } else if (normalizedStatus === 'досмотр' || normalizedStatus.includes('досмотр')) {
      message = 'досмотр';
    } else if (normalizedStatus === 'излишки') {
      message = 'излишки';
    }
    
    if (message) {
      speak(message);
    }
  }, [speak]);

  return { speak, announceStatus };
};

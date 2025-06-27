
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

  const playSiren = useCallback(() => {
    // Создаем звук сирены используя Speech Synthesis API
    // Используем специальные символы для создания звука сирены
    const sirenSound = 'у-у-у-у-у-у-у-у';
    
    if (!('speechSynthesis' in window)) {
      console.warn('Speech Synthesis API не поддерживается в этом браузере');
      return;
    }

    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(sirenSound);
    utterance.volume = volume;
    utterance.rate = 0.5; // Медленнее для эффекта сирены
    utterance.pitch = 0.1; // Низкий тон
    utterance.lang = 'ru-RU';

    console.log('Воспроизводится звук сирены');
    speechSynthesis.speak(utterance);
  }, [volume]);

  const announceStatus = useCallback((status: string) => {
    const normalizedStatus = status.toLowerCase().trim();
    
    if (normalizedStatus === 'допущенные' || normalizedStatus === 'допущен' || normalizedStatus.includes('допущ') || normalizedStatus === '0') {
      speak('ОК');
    } else if (
      normalizedStatus === 'недопущенные' || 
      normalizedStatus === 'недопущен' || 
      normalizedStatus.includes('недопущ') ||
      normalizedStatus === 'перелимит' || 
      normalizedStatus.includes('перелимит') ||
      normalizedStatus === 'досмотр' || 
      normalizedStatus.includes('досмотр') ||
      normalizedStatus === 'излишки'
    ) {
      playSiren();
    }
  }, [speak, playSiren]);

  return { speak, announceStatus, playSiren };
};

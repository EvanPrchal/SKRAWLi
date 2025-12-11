import { useState, useEffect } from "react";

const STORAGE_KEY_PREFIX = "profileImage_";

/**
 * Hook to manage profile image loading with fallback to last successful image.
 * Stores successfully loaded images in localStorage keyed by user ID.
 * If a new image fails to load, falls back to the last cached version.
 * @param userId - The ID of the user to track image for
 * @param imageUrl - The current/new image URL to load
 * @returns The image URL to display (either current, cached, or null)
 */
export const useProfileImage = (userId: number | string, imageUrl: string | null): string | null => {
  const [displayImage, setDisplayImage] = useState<string | null>(imageUrl);

  useEffect(() => {
    if (!imageUrl) {
      // If no image provided, try to use cached version
      const cached = localStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}`);
      setDisplayImage(cached);
      return;
    }

    // Try to load the new image
    const img = new Image();
    let isStale = false;

    img.onload = () => {
      if (!isStale) {
        // Successfully loaded, cache it and display
        localStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}`, imageUrl);
        setDisplayImage(imageUrl);
      }
    };

    img.onerror = () => {
      if (!isStale) {
        // Failed to load, fall back to cached version
        const cached = localStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}`);
        setDisplayImage(cached || null);
      }
    };

    // Start loading
    img.src = imageUrl;

    return () => {
      isStale = true;
    };
  }, [userId, imageUrl]);

  return displayImage;
};

/**
 * Clear cached image for a specific user
 */
export const clearCachedProfileImage = (userId: number | string) => {
  localStorage.removeItem(`${STORAGE_KEY_PREFIX}${userId}`);
};

/**
 * Clear all cached profile images
 */
export const clearAllCachedProfileImages = () => {
  const keys = Object.keys(localStorage).filter((key) => key.startsWith(STORAGE_KEY_PREFIX));
  keys.forEach((key) => localStorage.removeItem(key));
};

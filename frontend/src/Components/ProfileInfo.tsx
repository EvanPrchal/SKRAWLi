import { useAuth0 } from "@auth0/auth0-react";
import { useEffect, useState } from "react";
import { useApi } from "../lib/api";
import { useProfileImage } from "../lib/useProfileImage";

type BadgeInfo = {
  code: string;
  name: string;
  description: string | null;
};

interface ProfileInfoProps {
  profileBackground: string;
  onBackgroundChange: (bg: string) => void;
}

const BACKGROUND_OPTIONS = [
  { name: "1", value: "bg-skrawl-cyan" },
  { name: "2", value: "bg-skrawl-magenta" },
  { name: "3", value: "bg-skrawl-orange" },
];

const ProfileInfo: React.FC<ProfileInfoProps> = ({ profileBackground, onBackgroundChange }) => {
  const { user, isLoading } = useAuth0();
  const api = useApi();
  const [bio, setBio] = useState<string>("");
  const [displayName, setDisplayName] = useState<string>("");
  const [pictureUrl, setPictureUrl] = useState<string | null>(null);
  const displayImage = useProfileImage(user?.sub || "unknown", pictureUrl);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasColorPicker, setHasColorPicker] = useState(false);
  const [ownedBadges, setOwnedBadges] = useState<BadgeInfo[]>([]);
  const [showcasedBadgeCodes, setShowcasedBadgeCodes] = useState<string[]>([]);
  const [isSelectingBadges, setIsSelectingBadges] = useState(false);

  // Temporary state for editing
  const [editBio, setEditBio] = useState<string>("");
  const [editDisplayName, setEditDisplayName] = useState<string>("");
  const [editProfileBackground, setEditProfileBackground] = useState<string>("");
  const [editShowcasedBadges, setEditShowcasedBadges] = useState<string[]>([]);

  useEffect(() => {
    if (isLoading) return;
    let cancelled = false;
    const load = async () => {
      try {
        const [profileData, ownedItems, badges] = await Promise.all([api.getMyProfile(), api.getOwnedItems(), api.getMyBadges()]);
        if (cancelled) return;
        setBio(profileData.bio || "");
        setDisplayName(profileData.display_name || user?.name || "");
        setPictureUrl(profileData.picture_url || user?.picture || null);
        const codes = profileData.showcased_badges ? profileData.showcased_badges.split(",").filter(Boolean) : [];
        setShowcasedBadgeCodes(codes);
        const ownsColorPicker = ownedItems.some((item) => item.item_id === "color-picker");
        setHasColorPicker(ownsColorPicker);
        setOwnedBadges(badges);

        const needsDisplayNameSync = (!profileData.display_name || profileData.display_name.trim().length === 0) && user?.name;
        const needsPictureSync = (!profileData.picture_url || profileData.picture_url.trim().length === 0) && user?.picture;
        if ((needsDisplayNameSync || needsPictureSync) && !cancelled) {
          try {
            const synced = await api.updateMyProfile({
              display_name: needsDisplayNameSync ? user?.name ?? null : undefined,
              picture_url: needsPictureSync ? user?.picture ?? null : undefined,
            });
            if (!cancelled) {
              setDisplayName(synced.display_name || user?.name || "");
              setPictureUrl(synced.picture_url || user?.picture || null);
            }
          } catch (syncErr) {
            console.error("Failed to sync Auth0 profile fields:", syncErr);
          }
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  const handleEdit = () => {
    setEditDisplayName(displayName);
    setEditBio(bio);
    setEditProfileBackground(profileBackground);
    setEditShowcasedBadges([...showcasedBadgeCodes]);
    setIsEditing(true);
  };

  const handleBackgroundSelect = (bg: string) => {
    setEditProfileBackground(bg);
    onBackgroundChange(bg); // Preview immediately
  };

  const toggleShowcasedBadge = (code: string) => {
    setEditShowcasedBadges((prev) => {
      if (prev.includes(code)) {
        return prev.filter((c) => c !== code);
      } else if (prev.length < 3) {
        return [...prev, code];
      }
      return prev;
    });
  };

  const handleSave = async () => {
    if (editDisplayName.trim().length === 0) {
      alert("Display name cannot be empty");
      return;
    }
    setIsSaving(true);
    try {
      const updated = await api.updateMyProfile({
        display_name: editDisplayName,
        bio: editBio,
        profile_background: editProfileBackground,
        showcased_badges: editShowcasedBadges.join(","),
      });
      setDisplayName(updated.display_name || "");
      setBio(updated.bio || "");
      const updatedCodes = updated.showcased_badges ? updated.showcased_badges.split(",").filter(Boolean) : [];
      setShowcasedBadgeCodes(updatedCodes);
      setEditShowcasedBadges(updatedCodes);
      setPictureUrl(updated.picture_url || user?.picture || null);
      onBackgroundChange(updated.profile_background || profileBackground);
      setEditProfileBackground(updated.profile_background || profileBackground);
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to save profile:", err);
      alert("Failed to save profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditDisplayName(displayName);
    setEditBio(bio);
    onBackgroundChange(profileBackground); // Revert preview
    setEditProfileBackground(profileBackground);
    setEditShowcasedBadges([...showcasedBadgeCodes]);
    setIsEditing(false);
    setIsSelectingBadges(false);
  };

  const showcasedBadges = showcasedBadgeCodes.map((code) => ownedBadges.find((b) => b.code === code)).filter((b): b is BadgeInfo => b !== undefined);

  const editShowcasedBadgesInfo = editShowcasedBadges
    .map((code) => ownedBadges.find((b) => b.code === code))
    .filter((b): b is BadgeInfo => b !== undefined);

  return (
    <div className="text-center flex justify-around w-full gap-8">
      <section className="flex flex-col justify-center items-center space-y-4">
        {displayImage && !imageLoadError ? (
          <img
            className="w-28 h-28 rounded-full border border-skrawl-purple/40 object-cover"
            src={displayImage}
            alt={displayName || user?.name || "Profile"}
            onError={() => setImageLoadError(true)}
          />
        ) : (
          <div className="w-28 h-28 rounded-full bg-skrawl-purple/20 border border-skrawl-purple/40 flex items-center justify-center text-skrawl-purple text-3xl font-header">
            {(displayName || user?.name || "U").charAt(0).toUpperCase()}
          </div>
        )}

        {isEditing ? (
          <div className="flex flex-col gap-4 w-full max-w-md">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-body text-skrawl-purple text-left">Display Name</label>
              <input
                type="text"
                value={editDisplayName}
                onChange={(e) => setEditDisplayName(e.target.value)}
                maxLength={50}
                placeholder="Enter display name..."
                className="text-body font-body text-skrawl-purple border border-skrawl-purple rounded p-2"
              />
              <span className="text-xs text-gray-500 text-right">{editDisplayName.length}/50</span>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-body text-skrawl-purple text-left">Bio</label>
              <textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                maxLength={500}
                placeholder="Tell us about yourself..."
                className="text-body font-body text-skrawl-purple border border-skrawl-purple rounded p-2 resize-none"
                rows={4}
              />
              <span className="text-xs text-gray-500 text-right">{editBio.length}/500</span>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-body text-skrawl-purple text-left">Background Color</label>
              <div className="flex flex-wrap gap-3 justify-center">
                {BACKGROUND_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleBackgroundSelect(option.value)}
                    className={`flex flex-col items-center gap-1 p-2 rounded border-2 transition-all ${
                      editProfileBackground === option.value ? "border-skrawl-purple scale-110" : "border-gray-300 hover:border-skrawl-magenta"
                    }`}
                  >
                    <div className={`w-12 h-12 rounded ${option.value} border border-gray-400`} />
                    <span className="text-xs text-skrawl-purple">{option.name}</span>
                  </button>
                ))}
              </div>
              {hasColorPicker && (
                <div className="flex flex-col gap-2 mt-3">
                  <label className="text-sm font-body text-skrawl-purple text-left">Or choose a custom color:</label>
                  <input
                    type="color"
                    value={editProfileBackground.startsWith("#") ? editProfileBackground : "#000000"}
                    onChange={(e) => handleBackgroundSelect(e.target.value)}
                    className="w-full h-12 rounded border border-skrawl-purple cursor-pointer"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-center">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 bg-skrawl-purple text-white rounded hover:bg-skrawl-magenta transition-colors disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Profile"}
              </button>
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 items-center">
            <h2 className="text-header font-body text-skrawl-purple">{displayName || user?.name || "Username"}</h2>
            <h2 className="text-body font-body text-skrawl-purple max-w-md">{bio || "No bio yet."}</h2>
            <button onClick={handleEdit} className="px-4 py-2 bg-skrawl-purple text-white rounded hover:bg-skrawl-magenta transition-colors">
              Edit Profile
            </button>
          </div>
        )}
      </section>
      <section className="flex flex-col items-center justify-center space-y-6">
        <h2 className="text-header font-body underline text-skrawl-purple">Showcased Badges</h2>
        {isEditing ? (
          <div className="flex flex-col gap-4 items-center">
            <div className="flex gap-4 justify-center">
              {[0, 1, 2].map((idx) => {
                const badge = editShowcasedBadgesInfo[idx];
                return (
                  <div
                    key={idx}
                    className={`w-20 h-20 rounded-full flex items-center justify-center border-2 ${
                      badge ? "border-skrawl-purple bg-skrawl-purple/20" : "border-gray-300 bg-gray-100"
                    }`}
                    title={badge?.name || "Empty slot"}
                  >
                    <span className="text-2xl">{badge ? "🏆" : "○"}</span>
                  </div>
                );
              })}
            </div>
            <button
              onClick={() => setIsSelectingBadges(!isSelectingBadges)}
              className="text-sm text-skrawl-purple hover:text-skrawl-magenta underline"
            >
              {isSelectingBadges ? "Hide Badge Selection" : "Select Badges to Showcase"}
            </button>
            {isSelectingBadges && (
              <div className="max-h-64 overflow-y-auto border border-gray-300 rounded p-3 w-full">
                <div className="text-xs text-gray-600 mb-2">Select up to 3 badges (you own {ownedBadges.length})</div>
                <div className="grid gap-2">
                  {ownedBadges.length === 0 ? (
                    <div className="text-sm text-gray-500">No badges earned yet. Play games to unlock badges!</div>
                  ) : (
                    ownedBadges.map((badge) => {
                      const selected = editShowcasedBadges.includes(badge.code);
                      return (
                        <button
                          key={badge.code}
                          onClick={() => toggleShowcasedBadge(badge.code)}
                          className={`flex items-center gap-2 p-2 rounded border transition ${
                            selected ? "border-skrawl-purple bg-skrawl-purple/10" : "border-gray-300 hover:border-skrawl-magenta"
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center border ${
                              selected ? "border-skrawl-purple" : "border-gray-400"
                            }`}
                          >
                            <span className="text-sm">🏆</span>
                          </div>
                          <div className="text-left flex-grow">
                            <div className="text-sm font-body text-skrawl-purple">{badge.name}</div>
                          </div>
                          {selected && <span className="text-skrawl-purple text-sm">✓</span>}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex gap-6 flex-wrap justify-around w-full max-w-md">
            {[0, 1, 2].map((idx) => {
              const badge = showcasedBadges[idx];
              return (
                <div key={idx} className="flex flex-col items-center gap-2">
                  <div
                    className={`w-20 h-20 rounded-full flex items-center justify-center border-2 shadow-md ${
                      badge ? "border-skrawl-purple bg-skrawl-purple/20" : "border-gray-300 bg-gray-100"
                    }`}
                    title={badge?.name || "Empty slot"}
                  >
                    <span className="text-2xl">{badge ? "🏆" : "○"}</span>
                  </div>
                  {badge && <div className="text-xs font-body text-skrawl-purple text-center max-w-[80px]">{badge.name}</div>}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default ProfileInfo;

import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useProfileImage } from "../lib/useProfileImage";

export interface UserProfileData {
  id: number;
  display_name: string | null;
  bio: string | null;
  profile_background: string | null;
  showcased_badges: string | null;
  picture_url: string | null;
}

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfileData | null;
  loading: boolean;
  error: string | null;
  isFriend: boolean;
  onAddFriend?: () => void;
  onRemoveFriend?: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, profile, loading, error, isFriend, onAddFriend, onRemoveFriend }) => {
  const displayImage = useProfileImage(profile?.id || "unknown", profile?.picture_url || null);
  const showcased = (profile?.showcased_badges || "")
    .split(/[,\s]+/)
    .filter((b) => b.trim().length > 0)
    .slice(0, 3);

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-lg bg-skrawl-white p-6 text-skrawl-purple shadow-xl border border-skrawl-purple/30">
                <div className="flex justify-between items-start mb-4">
                  <Dialog.Title className="text-header font-header">
                    {profile?.display_name || (profile ? `User #${profile.id}` : "Profile")}
                  </Dialog.Title>
                  <button onClick={onClose} className="px-2 py-1 text-sm rounded-md bg-gray-200 hover:bg-gray-300 text-skrawl-purple">
                    Close
                  </button>
                </div>
                {loading && <div className="text-sm">Loading profile…</div>}
                {!loading && error && <div className="text-sm text-red-600">{error}</div>}
                {!loading && profile && (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                      {displayImage ? (
                        <img
                          src={displayImage}
                          alt={profile.display_name || `User ${profile.id}`}
                          className="w-16 h-16 rounded-full border border-skrawl-purple/40 object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-skrawl-purple/20 border border-skrawl-purple/40 flex items-center justify-center text-skrawl-purple font-header text-xl">
                          {(profile.display_name || "U").charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="text-body font-body text-sm">ID: {profile.id}</span>
                        {profile.profile_background && <span className="text-xs font-body opacity-70">Background: {profile.profile_background}</span>}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-header mb-1">Bio</h3>
                      <p className="text-sm font-body whitespace-pre-wrap max-h-40 overflow-y-auto">{profile.bio || "No bio provided."}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-header mb-1">Showcased Badges</h3>
                      {showcased.length === 0 && <p className="text-xs font-body">None</p>}
                      <div className="flex flex-wrap gap-2">
                        {showcased.map((b) => (
                          <span
                            key={b}
                            className="px-2 py-1 rounded-md bg-skrawl-purple/10 text-skrawl-purple text-xs border border-skrawl-purple/30"
                          >
                            {b}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-2">
                      {isFriend ? (
                        <button onClick={onRemoveFriend} className="px-4 py-2 rounded-md bg-skrawl-purple text-white hover:bg-skrawl-magenta">
                          Remove Friend
                        </button>
                      ) : (
                        <button onClick={onAddFriend} className="px-4 py-2 rounded-md bg-skrawl-purple text-white hover:bg-skrawl-magenta">
                          Add Friend
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ProfileModal;

// src/pages/UserPublicProfile.jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FiBriefcase, FiMapPin, FiCalendar, FiUsers, FiUserPlus, FiUserCheck, FiMessageSquare, FiLink, FiAward, FiRss, FiGrid, FiEdit // Added FiLink, FiAward
} from 'react-icons/fi';
import { ImSpinner2, ImSpinner9 } from 'react-icons/im';
import { userService } from '../services/userService'; // Adjust path if needed
// import MainLayout from '../layouts/MainLayout'; // Optional: Use your app's layout

// --- Placeholder Auth Hook (Replace with actual implementation) ---
const useAuth = () => {
  const [user] = useState({ id: 'LOGGED_IN_USER_ID_EXAMPLE' }); // Simulate logged-in
  // const [user] = useState(null); // Simulate logged-out
  return { user, isAuthenticated: !!user };
};
// --- End Placeholder Auth Hook ---

// --- Placeholder Service Functions (Simulated) ---
const followUser = async (userId) => { console.log(`Simulating follow user: ${userId}`); await new Promise(res => setTimeout(res, 600)); return { success: true }; };
const unfollowUser = async (userId) => { console.log(`Simulating unfollow user: ${userId}`); await new Promise(res => setTimeout(res, 600)); return { success: true }; };
const checkFollowingStatus = async (targetUserId) => { console.log(`Simulating check follow status for: ${targetUserId}`); await new Promise(res => setTimeout(res, 250)); return Math.random() > 0.6; };
// --- End Placeholder Service Functions ---

// --- Helper Components ---
function StatItem({ value, label }) {
  return (
    <div className="text-center sm:text-left">
      <span className="block text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </span>
      <span className="block text-xs sm:text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        {label}
      </span>
    </div>
  );
}

function TabButton({ label, isActive, onClick, icon: Icon }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 text-sm sm:text-base font-medium border-b-2 transition duration-150 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 ${
        isActive
          ? 'border-orange-500 text-orange-600 dark:text-orange-400'
          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
      }`}
      aria-current={isActive ? 'page' : undefined}
    >
      {Icon && <Icon className="w-4 h-4 sm:w-5 sm:h-5" />}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function ProfileSectionCard({ title, children, className = "" }) {
  return (
    <div className={`bg-white h-max dark:bg-gray-800 shadow-md rounded-lg overflow-hidden ${className}`}>
      {title && (
        <h2 className="text-base md:text-lg font-semibold text-gray-800 dark:text-gray-200 px-4 py-3 md:px-6 md:py-4 border-b border-gray-200 dark:border-gray-700">
          {title}
        </h2>
      )}
      <div className="p-4 md:p-6">
        {children}
      </div>
    </div>
  );
}
// --- End Helper Components ---

function UserPublicProfile() {
  const { userId } = useParams();
  const { user: loggedInUser, isAuthenticated } = useAuth();

  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // --- DUMMY DATA ---
  const dummyStats = {
    // Use profileUser data if available (though API doesn't provide it)
    followers: profileUser?.dummyFollowers ?? Math.floor(Math.random() * 5000) + 100,
    following: profileUser?.dummyFollowing ?? Math.floor(Math.random() * 1000) + 50,
    posts: profileUser?.dummyPostsCount ?? Math.floor(Math.random() * 200) + 5,
  };

  const dummyPosts = [
    { id: 1, content: "Just pushed an update to my latest project on GitHub! Excited about the new features. #opensource #development", timestamp: "4h ago", comments: 15, likes: 88 },
    { id: 2, content: "Had an amazing filter coffee this morning in Coimbatore. The simple things! ☕ #coimbatore #coffee", timestamp: "1d ago", comments: 8, likes: 120 },
    { id: 3, content: "Thinking about learning Go next. Any resources recommendations? #golang #programming", timestamp: "3d ago", comments: 25, likes: 95 }
  ];

  const dummyDetails = {
      website: "https://example.com", // Placeholder
  }
  // --- END DUMMY DATA ---

  const isOwnProfile = isAuthenticated && loggedInUser?.id === userId;

  // Fetch Profile Data Effect
  useEffect(() => {
    let isMounted = true;
    const fetchUserProfile = async () => {
        if (!userId) { if(isMounted) { setError('No User ID provided in the URL.'); setLoading(false); } return; }
        if(isMounted) { setLoading(true); setError(null); setProfileUser(null); setIsFollowing(false); }

        try {
            const fetchedUser = await userService.getUserProfilePreview(userId);
            if (!isMounted) return;
            if (!fetchedUser) { setError('User profile not found.'); }
            else {
                setProfileUser(fetchedUser);
                if (isAuthenticated && loggedInUser?.id !== userId) {
                    const followingStatus = await checkFollowingStatus(userId);
                    if (isMounted) setIsFollowing(followingStatus);
                }
            }
        } catch (err) { if (isMounted) { console.error('Error fetching user profile:', err); setError(err?.message || 'Failed to load profile.'); }}
        finally { if (isMounted) setLoading(false); }
    };
    fetchUserProfile();
    return () => { isMounted = false; };
  }, [userId, isAuthenticated, loggedInUser?.id]);

  const formatJoinDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return `Joined ${new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(date)}`;
    } catch (e) { return ''; }
  };

  // --- Action Handlers ---
  const handleFollowToggle = async () => {
    if (isFollowLoading || !isAuthenticated || isOwnProfile) return;
    setIsFollowLoading(true);
    const action = isFollowing ? unfollowUser : followUser;
    const newFollowState = !isFollowing;
    try {
      await action(userId);
      setIsFollowing(newFollowState);
    } catch (err) { console.error(`Failed to ${newFollowState ? 'follow' : 'unfollow'} user:`, err); /* TODO: Add user feedback */ }
    finally { setIsFollowLoading(false); }
  };

  // --- Render Loading/Error States ---
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <ImSpinner9 className="w-16 h-16 animate-spin text-orange-500" />
      </div>
    );
  }

  if (error || !profileUser) {
      // Consistent error/not found page structure
    return (
        <div className="flex flex-col justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900 text-center px-4">
          <h2 className="text-2xl font-semibold text-red-500 dark:text-red-400 mb-3">
            {error ? 'Load Error' : 'Profile Not Found'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
            {error || "Sorry, we couldn't find the profile you're looking for. It may have been moved or deleted."}
          </p>
          <Link
            to="/"
            className="inline-flex items-center px-6 py-2 bg-orange-500 text-white rounded-md shadow-sm hover:bg-orange-600 transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 dark:focus:ring-offset-gray-900"
          >
            Go Home
          </Link>
        </div>
      );
  }

  // --- Main Profile Render ---
  return (
    // <MainLayout> // Optional Layout Wrapper
    <div className="bg-gray-100 dark:bg-gray-900">
      {/* Banner */}
      <div className="h-48 sm:h-56 md:h-64 w-full bg-gradient-to-br from-orange-100 via-white to-orange-50 dark:from-gray-700 dark:via-gray-800 dark:to-gray-700/70">
        {/* Placeholder - Replace with user's actual banner or a default */}
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* --- Profile Header --- */}
        {/* Using negative margin to pull the content up over the banner */}
        <div className="relative -mt-20 sm:-mt-24 md:-mt-28 z-10">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-4 sm:p-6 md:p-8 flex flex-col md:flex-row md:items-end gap-4 md:gap-8">

            {/* Avatar (positioned normally within flex, negative margin pulls entire card up) */}
            <div className="flex-shrink-0 -mt-[calc(2rem+40px)] sm:-mt-[calc(3rem+40px)] md:-mt-[calc(4rem+40px)] self-center md:self-auto"> {/* Adjust based on padding & desired overlap */}
              {profileUser.profilePictureUrl ? (
                <img
                  src={profileUser.profilePictureUrl}
                  crossOrigin='anonymous'
                  alt={`${profileUser.name}'s avatar`}
                  className="w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 rounded-full object-cover ring-4 ring-white dark:ring-gray-800 shadow-lg bg-gray-200 dark:bg-gray-600"
                />
              ) : (
                <div className="w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 rounded-full ring-4 ring-white dark:ring-gray-800 shadow-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                  <span className="text-5xl sm:text-6xl font-semibold text-white select-none">
                    {profileUser?.name?.trim()?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>
              )}
            </div>

            {/* Info Block */}
            <div className="flex-grow text-center md:text-left pt-2 md:pt-0 md:pb-2">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
                {profileUser.name}
              </h1>
              {(profileUser.position || profileUser.company) && (
                <p className="text-md sm:text-lg text-gray-600 dark:text-gray-300 mt-1 flex items-center justify-center md:justify-start gap-1.5 flex-wrap">
                  <FiBriefcase aria-hidden="true" className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                  <span>{profileUser.position}{profileUser.position && profileUser.company && ` at ${profileUser.company}`}</span>
                </p>
              )}
              {profileUser.location && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center justify-center md:justify-start gap-1.5">
                  <FiMapPin aria-hidden="true" className="w-4 h-4" />
                  <span>{profileUser.location}</span>
                </p>
              )}
            </div>

            {/* Actions & Stats Block */}
            <div className="flex-shrink-0 flex flex-col items-center md:items-end gap-4 w-full md:w-auto">
               {/* Action Buttons */}
                <div className="flex items-center gap-2 sm:gap-3">
                  {isAuthenticated ? (
                    isOwnProfile ? (
                      <Link
                        to="/settings/profile"
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md shadow-sm transition duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 dark:focus:ring-offset-gray-800 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                      > <FiEdit className="w-4 h-4" /> Edit Profile </Link>
                    ) : ( // Follow/Unfollow Button
                      <button
                        onClick={handleFollowToggle}
                        disabled={isFollowLoading}
                        className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md shadow-sm transition duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 dark:focus:ring-offset-gray-800 disabled:opacity-60 ${
                          isFollowing
                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600' // Following style
                            : 'bg-orange-500 dark:bg-orange-600 text-white dark:text-white hover:bg-orange-600 dark:hover:bg-orange-700 border border-transparent' // Follow style
                        }`}
                      >
                        {isFollowLoading ? (
                          <ImSpinner2 className="w-4 h-4 animate-spin" />
                        ) : isFollowing ? (
                          <FiUserCheck className="w-4 h-4" />
                        ) : (
                          <FiUserPlus className="w-4 h-4" />
                        )}
                        <span>{isFollowing ? 'Following' : 'Follow'}</span>
                      </button>
                    )
                  ) : ( // Logged out user sees Follow -> Login
                    <Link
                      to="/login" state={{ from: location.pathname }}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md shadow-sm transition duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 dark:focus:ring-offset-gray-800 bg-orange-500 dark:bg-orange-600 text-white dark:text-white hover:bg-orange-600 dark:hover:bg-orange-700 border border-transparent"
                    > <FiUserPlus className="w-4 h-4" /> Follow </Link>
                  )}
                  {/* Message Button Placeholder */}
                  {!isOwnProfile && isAuthenticated && (
                    <button
                       title="Message (coming soon)"
                       className="inline-flex items-center justify-center p-2 text-sm font-medium rounded-md shadow-sm transition duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 dark:focus:ring-offset-gray-800 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600">
                      <FiMessageSquare className="w-4 h-4" />
                    </button>
                  )}
                </div>

                 {/* Stats */}
                <div className="flex items-center gap-4 sm:gap-6 pt-3 md:pt-1">
                    <StatItem value={dummyStats.posts} label="Posts" />
                    <StatItem value={dummyStats.followers} label="Followers" />
                    <StatItem value={dummyStats.following} label="Following" />
                </div>
            </div>
          </div>
        </div> {/* End Header Card */}

        {/* --- Profile Content Area with Tabs --- */}
        <div className="mt-6 sm:mt-8">
          {/* Tab Navigation */}
          <div className="border-b border-gray-300 dark:border-gray-700">
            <nav className="-mb-px flex space-x-1 sm:space-x-4 overflow-x-auto" aria-label="Tabs">
              <TabButton label="Overview" icon={FiGrid} isActive={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
              <TabButton label="Activity" icon={FiRss} isActive={activeTab === 'activity'} onClick={() => setActiveTab('activity')} />
              {/* Add more tabs */}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="mt-6">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <ProfileSectionCard title="About">
                    {profileUser.bio ? (
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{profileUser.bio}</p>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400 italic">{isOwnProfile ? "Add a bio to tell people about yourself." : "No bio available."}</p>
                    )}
                  </ProfileSectionCard>
                  {/* Add more cards here like Experience, Education if needed */}
                </div>
                <div className="lg:col-span-1 space-y-6">
                  <ProfileSectionCard title="Details">
                     <ul className="space-y-3 text-sm">
                        {dummyDetails.website && (
                            <li className="flex items-center gap-2 text-gray-600 dark:text-gray-300 break-all">
                                <FiLink className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                                <a href={dummyDetails.website} target="_blank" rel="noopener noreferrer" className="hover:text-orange-600 dark:hover:text-orange-400 hover:underline">
                                    {dummyDetails.website.replace(/^https?:\/\//, '')}
                                </a>
                            </li>
                        )}
                        {profileUser.createdAt && (
                            <li className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                <FiCalendar className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                                <span>{formatJoinDate(profileUser.createdAt)}</span>
                            </li>
                        )}
                        {/* Dummy Skills */}
                        {dummyDetails.skills?.length > 0 && (
                            <li className="flex items-start gap-2 text-gray-600 dark:text-gray-300">
                                <FiAward className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <span className="font-medium text-gray-700 dark:text-gray-200 block mb-1">Skills</span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {dummyDetails.skills.map(skill => (
                                            <span key={skill} className="bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-200 text-xs font-medium px-2 py-0.5 rounded-full">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </li>
                        )}
                     </ul>
                  </ProfileSectionCard>
                </div>
              </div>
            )}

            {activeTab === 'activity' && (
              <ProfileSectionCard title="Recent Activity">
                <div className="space-y-6">
                  {dummyPosts.length > 0 ? (
                    dummyPosts.map(post => (
                      <article key={post.id} className="border-b border-gray-200 dark:border-gray-700 pb-5 last:border-b-0">
                        <p className="text-gray-800 dark:text-gray-200 mb-2 leading-relaxed">{post.content}</p>
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                           <span>{post.timestamp}</span>
                           <div className="flex items-center gap-3">
                               <span>{post.likes} Likes</span>
                               <span>{post.comments} Comments</span>
                           </div>
                        </div>
                      </article>
                    ))
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 italic">{isOwnProfile ? "You haven't posted anything yet." : "This user hasn't posted anything yet."}</p>
                  )}
                </div>
              </ProfileSectionCard>
            )}
          </div>
        </div>
      </div>
    </div>
    // </MainLayout>
  );
}

export default UserPublicProfile;
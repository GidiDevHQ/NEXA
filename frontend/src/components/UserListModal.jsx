import { Link } from 'react-router-dom';

/**
 * UserListModal — reusable modal overlay for displaying a list of users
 * (followers or following).
 *
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   title: string,
 *   users: Array<{ _id: string, username: string, first_name?: string, last_name?: string }> | null,
 *   loading: boolean,
 *   error: string
 * }} props
 */
const UserListModal = ({ isOpen, onClose, title, users, loading, error }) => {
  if (!isOpen) return null;

  const titleId = 'user-list-modal-title';

  const getDisplayName = (user) => {
    if (typeof user === 'string') return 'User';
    const name = [user.first_name, user.last_name].filter(Boolean).join(' ');
    return name || user.username || 'User';
  };

  const getUsername = (user) => {
    if (typeof user === 'string') return '';
    return user.username || '';
  };

  const getUserId = (user) => {
    if (typeof user === 'string') return user;
    return user._id;
  };

  const normalizedUsers = Array.isArray(users) ? users : [];

  return (
    /* Full-screen overlay */
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Semi-transparent backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 bg-white rounded-lg shadow-xl w-full max-w-md mx-4 flex flex-col max-h-[80vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2
            id={titleId}
            className="text-lg font-semibold text-gray-900"
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-4">
          {loading ? (
            /* Spinner */
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
            </div>
          ) : error ? (
            /* Error message */
            <p className="text-red-600 text-center py-6">{error}</p>
          ) : normalizedUsers.length === 0 ? (
            /* Empty state */
            <p className="text-gray-500 text-center py-6">No users found</p>
          ) : (
            /* User list */
            <ul className="divide-y divide-gray-100">
              {normalizedUsers.map((user) => {
                const id = getUserId(user);
                const displayName = getDisplayName(user);
                const username = getUsername(user);

                return (
                  <li key={id}>
                    <Link
                      to={`/users/${id}`}
                      onClick={onClose}
                      className="flex flex-col py-3 hover:bg-gray-50 rounded-md px-2 transition-colors"
                    >
                      <span className="font-medium text-gray-900">
                        {displayName}
                      </span>
                      {username && (
                        <span className="text-sm text-gray-500">
                          @{username}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserListModal;

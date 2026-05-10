import { Link } from 'react-router-dom';

/**
 * PostCard — purely presentational card for a single post.
 * No internal state or API calls.
 *
 * @param {{ post: {
 *   _id: string,
 *   title: string,
 *   content: string,
 *   tags?: string[],
 *   like_count: number,
 *   comment_count: number,
 *   createdAt: string,
 *   author: { _id: string, username: string, first_name?: string, last_name?: string }
 * }}} props
 */
const PostCard = ({ post }) => {
  const { _id, title, content, tags, like_count, comment_count, createdAt, author } = post;

  // Derive display name: "First Last" if available, otherwise username
  const displayName =
    author?.first_name || author?.last_name
      ? `${author.first_name ?? ''} ${author.last_name ?? ''}`.trim()
      : author?.username || 'Unknown';

  // Avatar initial: prefer first_name initial, fall back to username initial
  const avatarInitial = (
    author?.first_name?.charAt(0) ||
    author?.username?.charAt(0) ||
    'U'
  ).toUpperCase();

  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '';

  const normalizedTags = Array.isArray(tags) ? tags : [];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Author row */}
      <div className="flex items-center mb-4">
        <Link
          to={`/users/${author?._id}`}
          className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold mr-3 flex-shrink-0 hover:bg-blue-600"
          aria-label={`View ${displayName}'s profile`}
        >
          {avatarInitial}
        </Link>
        <div>
          <Link
            to={`/users/${author?._id}`}
            className="font-semibold text-gray-900 hover:text-blue-600"
          >
            {displayName}
          </Link>
          <p className="text-sm text-gray-500">{formattedDate}</p>
        </div>
      </div>

      {/* Post title */}
      <Link to={`/posts/${_id}`}>
        <h3 className="text-xl font-semibold text-gray-900 mb-2 hover:text-blue-600">
          {title}
        </h3>
      </Link>

      {/* Content excerpt */}
      <p className="text-gray-700 mb-4 line-clamp-3">{content}</p>

      {/* Tags */}
      {normalizedTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {normalizedTags.map((tag) => (
            <span
              key={tag}
              className="bg-blue-100 text-blue-700 text-xs font-medium px-2.5 py-0.5 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Stats row */}
      <div className="flex items-center space-x-4 text-sm text-gray-600">
        <span className="flex items-center space-x-1">
          <span>❤️</span>
          <span>{like_count ?? 0}</span>
        </span>
        <span className="flex items-center space-x-1">
          <span>💬</span>
          <span>{comment_count ?? 0}</span>
        </span>
      </div>
    </div>
  );
};

export default PostCard;

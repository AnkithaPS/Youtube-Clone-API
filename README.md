# YouTube Clone API

A feature-rich YouTube clone RESTful API built with Express.js, MongoDB, Mongoose, JWT authentication, and Cloudinary for media storage.

## Project Overview

This API provides all the necessary backend functionality to build a YouTube-like platform, including user management, video uploads, comments, likes, subscriptions, and playlists. It follows best practices for RESTful API design, authentication, error handling, and data validation.

## Features

### User Management

- User registration and login with JWT authentication
- Profile management (update details, change password, upload avatar)
- Watch history tracking

### Video Management

- Upload, update, and delete videos
- Cloudinary integration for video and thumbnail storage
- Video search, filtering, and pagination
- Categories and tags

### Engagement Features

- Like/unlike videos and comments
- Comment on videos and reply to comments
- Subscribe/unsubscribe to channels

### Content Organization

- Create and manage playlists
- Add/remove videos to playlists
- Public and private playlists

## API Endpoints

### User Management

| Method | Endpoint                 | Description              | Auth Required |
| ------ | ------------------------ | ------------------------ | ------------- |
| POST   | /users/register          | Register a new user      | No            |
| POST   | /users/login             | Login user               | No            |
| POST   | /users/logout            | Logout user              | Yes           |
| POST   | /users/refresh-token     | Refresh access token     | No            |
| GET    | /users/current-user      | Get current user details | Yes           |
| PATCH  | /users/change-password   | Change user password     | Yes           |
| PATCH  | /users/update-account    | Update account details   | Yes           |
| PATCH  | /users/avatar            | Update user avatar       | Yes           |
| PATCH  | /users/cover-image       | Update user cover image  | Yes           |
| GET    | /users/channel/:username | Get user channel profile | No            |
| GET    | /users/history           | Get user watch history   | Yes           |

### Video Management

| Method | Endpoint                        | Description                 | Auth Required |
| ------ | ------------------------------- | --------------------------- | ------------- |
| GET    | /videos                         | Get all videos with filters | No            |
| POST   | /videos                         | Upload a new video          | Yes           |
| GET    | /videos/:videoId                | Get a video by ID           | No            |
| PATCH  | /videos/:videoId                | Update a video              | Yes           |
| DELETE | /videos/:videoId                | Delete a video              | Yes           |
| PATCH  | /videos/toggle-publish/:videoId | Toggle video publish status | Yes           |

### Comments

| Method | Endpoint                     | Description                  | Auth Required |
| ------ | ---------------------------- | ---------------------------- | ------------- |
| GET    | /comments/video/:videoId     | Get all comments for a video | No            |
| POST   | /comments/video/:videoId     | Add a comment to a video     | Yes           |
| PATCH  | /comments/:commentId         | Update a comment             | Yes           |
| DELETE | /comments/:commentId         | Delete a comment             | Yes           |
| GET    | /comments/:commentId/replies | Get replies to a comment     | No            |

### Likes

| Method | Endpoint                         | Description                | Auth Required |
| ------ | -------------------------------- | -------------------------- | ------------- |
| POST   | /likes/toggle/video/:videoId     | Toggle like on a video     | Yes           |
| POST   | /likes/toggle/comment/:commentId | Toggle like on a comment   | Yes           |
| GET    | /likes/videos                    | Get user's liked videos    | Yes           |
| GET    | /likes/video/:videoId            | Get all likes on a video   | No            |
| GET    | /likes/comment/:commentId        | Get all likes on a comment | No            |

### Subscriptions

| Method | Endpoint                                      | Description                      | Auth Required |
| ------ | --------------------------------------------- | -------------------------------- | ------------- |
| POST   | /subscriptions/toggle/:channelId              | Subscribe/unsubscribe to channel | Yes           |
| GET    | /subscriptions/user/channels                  | Get user's subscribed channels   | Yes           |
| GET    | /subscriptions/user/:subscriberId/channels    | Get user's subscriptions         | No            |
| GET    | /subscriptions/channel/subscribers            | Get current user's subscribers   | Yes           |
| GET    | /subscriptions/channel/:channelId/subscribers | Get channel subscribers          | No            |

### Playlists

| Method | Endpoint                               | Description                  | Auth Required |
| ------ | -------------------------------------- | ---------------------------- | ------------- |
| POST   | /playlists                             | Create a new playlist        | Yes           |
| GET    | /playlists/user                        | Get current user's playlists | Yes           |
| GET    | /playlists/user/:userId                | Get user's public playlists  | No            |
| GET    | /playlists/:playlistId                 | Get a playlist by ID         | No            |
| PATCH  | /playlists/:playlistId                 | Update a playlist            | Yes           |
| DELETE | /playlists/:playlistId                 | Delete a playlist            | Yes           |
| PATCH  | /playlists/:playlistId/add/:videoId    | Add video to playlist        | Yes           |
| PATCH  | /playlists/:playlistId/remove/:videoId | Remove video from playlist   | Yes           |

## Request and Response Examples

### User Registration

**Request:**

```
POST /api/v1/users/register
Content-Type: multipart/form-data

{
  "username": "testuser",
  "email": "test@example.com",
  "fullName": "Test User",
  "password": "Password123",
  "avatar": (file),
  "coverImage": (file)
}
```

**Response:**

```json
{
  "statusCode": 201,
  "data": {
    "_id": "60f7b0b9e6b3f32d1c8917a8",
    "username": "testuser",
    "email": "test@example.com",
    "fullName": "Test User",
    "avatar": {
      "public_id": "avatars/abcd1234",
      "url": "https://res.cloudinary.com/demo/image/upload/v1626789945/avatars/abcd1234.jpg"
    },
    "coverImage": {
      "public_id": "cover-images/efgh5678",
      "url": "https://res.cloudinary.com/demo/image/upload/v1626789945/cover-images/efgh5678.jpg"
    }
  },
  "message": "User registered successfully",
  "success": true
}
```

### Video Upload

**Request:**

```
POST /api/v1/videos
Content-Type: multipart/form-data
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "title": "Test Video",
  "description": "This is a test video",
  "category": "Technology",
  "tags": ["test", "video", "api"],
  "videoFile": (file),
  "thumbnail": (file)
}
```

**Response:**

```json
{
  "statusCode": 201,
  "data": {
    "_id": "60f7b1c9e6b3f32d1c8917a9",
    "title": "Test Video",
    "description": "This is a test video",
    "videoFile": {
      "public_id": "videos/ijkl9012",
      "url": "https://res.cloudinary.com/demo/video/upload/v1626790089/videos/ijkl9012.mp4"
    },
    "thumbnail": {
      "public_id": "thumbnails/mnop3456",
      "url": "https://res.cloudinary.com/demo/image/upload/v1626790089/thumbnails/mnop3456.jpg"
    },
    "duration": 120,
    "owner": "60f7b0b9e6b3f32d1c8917a8",
    "category": "Technology",
    "tags": ["test", "video", "api"],
    "isPublished": true
  },
  "message": "Video published successfully",
  "success": true
}
```

### Add Comment

**Request:**

```
POST /api/v1/comments/video/60f7b1c9e6b3f32d1c8917a9
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "content": "Great video!"
}
```

**Response:**

```json
{
  "statusCode": 201,
  "data": {
    "_id": "60f7b2d9e6b3f32d1c8917aa",
    "content": "Great video!",
    "video": "60f7b1c9e6b3f32d1c8917a9",
    "owner": {
      "_id": "60f7b0b9e6b3f32d1c8917a8",
      "username": "testuser",
      "fullName": "Test User",
      "avatar": {
        "url": "https://res.cloudinary.com/demo/image/upload/v1626789945/avatars/abcd1234.jpg"
      }
    }
  },
  "message": "Comment added successfully",
  "success": true
}
```

## Data Models and Associations

### Data Association Diagram

```
┌───────────────┐     owns     ┌───────────────┐
│               │◄────────────┤               │
│     User      │              │     Video     │
│               │─────────────►│               │
└───────────────┘   watches    └───────────────┘
        △                              △
        │                              │
   subscribes                       contains
        │                              │
        ▼                              ▼
┌───────────────┐              ┌───────────────┐
│               │              │               │
│ Subscription  │              │   Comment     │
│               │              │               │
└───────────────┘              └───────────────┘
                                      △
                                      │
                                    parent
                                      │
                                      ▼
┌───────────────┐              ┌───────────────┐
│               │  contains    │               │
│   Playlist    │◄────────────┤     Like      │
│               │              │               │
└───────────────┘              └───────────────┘
```

### Model Relationships

1. **User**

   - Has many Videos (one-to-many)
   - Has many Comments (one-to-many)
   - Has many Playlists (one-to-many)
   - Has many Likes (one-to-many)
   - Has many Subscriptions as subscriber (one-to-many)
   - Has many Subscriptions as channel (one-to-many)
   - Has watch history of Videos (many-to-many)

2. **Video**

   - Belongs to one User (many-to-one)
   - Has many Comments (one-to-many)
   - Has many Likes (one-to-many)
   - Belongs to many Playlists (many-to-many)
   - Watched by many Users (many-to-many)

3. **Comment**

   - Belongs to one User (many-to-one)
   - Belongs to one Video (many-to-one)
   - Can have a parent Comment (self-referential)
   - Has many child Comments (one-to-many)
   - Has many Likes (one-to-many)

4. **Like**

   - Belongs to one User (many-to-one)
   - Belongs to either one Video OR one Comment (polymorphic)

5. **Subscription**

   - Connects a User (subscriber) to another User (channel)
   - Represents a many-to-many relationship between Users

6. **Playlist**
   - Belongs to one User (many-to-one)
   - Contains many Videos (many-to-many)

## Application Flow

### Application Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │     │             │
│   Client    │────►│   Routes    │────►│ Controllers │────►│   Models    │
│             │     │             │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
       ▲                   │                   │                   │
       │                   │                   │                   │
       │                   ▼                   ▼                   ▼
       │             ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
       │             │             │     │             │     │             │
       └─────────────│  Response   │◄────│   Utils     │◄────│  Database   │
                     │             │     │             │     │             │
                     └─────────────┘     └─────────────┘     └─────────────┘
                                               │
                                               │
                                               ▼
                                         ┌─────────────┐
                                         │             │
                                         │ Middlewares │
                                         │             │
                                         └─────────────┘
```

### Process Flows

1. **Authentication Flow**:

   - Client sends credentials
   - Server validates user
   - JWT tokens are generated and returned
   - Protected routes use token for authentication

2. **Video Upload Flow**:

   - Video and thumbnail files are uploaded to Cloudinary
   - Metadata is stored in MongoDB
   - Video is associated with the user

3. **Comment System Flow**:

   - Comments are linked to videos and users
   - Nested comments are supported through parent references
   - Comments can be liked, updated, or deleted

4. **Subscription Flow**:
   - Users can subscribe to other users' channels
   - Subscription status determines content visibility
   - Subscription counts are tracked for analytics

## Installation and Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create `.env` file with the following variables:
   ```
   PORT=8000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/youtube-clone
   ACCESS_TOKEN_SECRET=your_access_token_secret
   REFRESH_TOKEN_SECRET=your_refresh_token_secret
   ACCESS_TOKEN_EXPIRY=15m
   REFRESH_TOKEN_EXPIRY=30d
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   CORS_ORIGIN=*
   ```
4. Start development server:
   ```
   npm run dev
   ```

## Technologies Used

- **Express.js** - Web framework
- **MongoDB with Mongoose** - Database and ODM
- **JWT** - Authentication
- **Cloudinary** - Media storage
- **Multer** - File uploads
- **Joi** - Data validation

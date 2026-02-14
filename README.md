# 🏕️ YelpCamp

A full-stack campground review web application built with Node.js, Express, MongoDB, and Bootstrap. Users can browse campgrounds, create accounts, add new campgrounds, leave reviews, and interact with an interactive map showing campground locations.

![YelpCamp Banner](https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1200&h=300&fit=crop)

## 🌟 Features

### Core Functionality
- **User Authentication** - Secure registration and login with passport.js
- **Campground Management** - Create, read, update, and delete campgrounds
- **Reviews & Ratings** - Leave reviews with star ratings on campgrounds
- **Interactive Maps** - View campground locations on an interactive map using Leaflet/OpenStreetMap
- **Image Uploads** - Upload multiple images per campground with Cloudinary integration
- **Authorization** - Users can only edit/delete their own campgrounds and reviews
- **Responsive Design** - Mobile-friendly interface with Bootstrap 5

### Security Features
- **Authentication & Authorization** - Session-based authentication with Passport.js
- **Data Validation** - Server-side validation with Joi schemas
- **Sanitization** - Input sanitization to prevent NoSQL injection attacks
- **Security Headers** - Helmet.js for secure HTTP headers
- **Content Security Policy** - CSP headers to prevent XSS attacks
- **Rate Limiting** - Protection against brute force attacks

### Performance
- **Compression** - Gzip compression for faster loading
- **Static File Caching** - Optimized asset delivery
- **Session Storage** - MongoDB session store for scalability
- **Database Indexing** - Optimized queries with proper indexes

## 🛠️ Technologies Used

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **Passport.js** - Authentication middleware
- **Express-session** - Session management
- **Connect-mongo** - MongoDB session store

### Frontend
- **EJS** - Template engine
- **Bootstrap 5** - CSS framework
- **Leaflet** - Interactive maps
- **JavaScript (Vanilla)** - Client-side functionality

### Cloud Services
- **Cloudinary** - Image storage and optimization
- **MongoDB Atlas** - Cloud database hosting
- **Render/Heroku** - Application hosting

### Security & Validation
- **Helmet** - Security headers
- **Joi** - Schema validation
- **Express-mongo-sanitize** - NoSQL injection prevention
- **Sanitize-html** - XSS protection

## 📋 Prerequisites

Before running this application, make sure you have:

- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **MongoDB** - [Download](https://www.mongodb.com/try/download/community) or use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- **Cloudinary Account** - [Sign up](https://cloudinary.com/) for image hosting
- **Git** - [Download](https://git-scm.com/)

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Nmbaby/yelpcamp.git
cd yelpcamp
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory:

```env
# Development (uses local MongoDB)
NODE_ENV=development

# Session Secret (change to a random string)
SESSION_SECRET=your_super_secret_random_string_here

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_KEY=your_cloudinary_key
CLOUDINARY_SECRET=your_cloudinary_secret

# Optional: Mapbox Token for geocoding (can use OpenStreetMap instead)
MAPBOX_TOKEN=your_mapbox_token
```

**For Production:**
```env
NODE_ENV=production
DB_URL=mongodb+srv://username:password@cluster.mongodb.net/yelp-camp
SESSION_SECRET=your_production_secret
CLOUDINARY_CLOUD_NAME=your_name
CLOUDINARY_KEY=your_key
CLOUDINARY_SECRET=your_secret
```

### 4. Set Up Cloudinary

1. Sign up at [Cloudinary](https://cloudinary.com/)
2. Get your Cloud Name, API Key, and API Secret from the dashboard
3. Add them to your `.env` file

### 5. Set Up Database

**Option A: Local MongoDB**
- Make sure MongoDB is running locally
- The app will automatically connect to `mongodb://127.0.0.1:27017/yelp-camp`

**Option B: MongoDB Atlas**
- Create a cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Get your connection string
- Add it as `DB_URL` in your `.env` file
- Whitelist your IP address in Network Access

### 6. Run the Application

```bash
npm start
```

The app will be running at `http://localhost:3000`

## 👤 User Management

### Seed Database (Optional)

If you want to populate the database with sample campgrounds:

```bash
node seeds/index.js
```

## 📁 Project Structure

```
yelpcamp/
├── app.js                  # Main application file
├── package.json            # Dependencies and scripts
├── .env                    # Environment variables (not in repo)
├── .gitignore             # Git ignore rules
│
├── models/                 # Mongoose models
│   ├── campground.js      # Campground schema
│   ├── review.js          # Review schema
│   └── user.js            # User schema
│
├── routes/                 # Express routes
│   ├── campgrounds.js     # Campground routes
│   ├── reviews.js         # Review routes
│   └── users.js           # Authentication routes
│
├── controllers/            # Route handlers
│   ├── campgrounds.js     # Campground logic
│   ├── reviews.js         # Review logic
│   └── users.js           # User logic
│
├── views/                  # EJS templates
│   ├── campgrounds/       # Campground views
│   ├── users/             # Auth views
│   ├── layouts/           # Layout templates
│   └── partials/          # Reusable components
│
├── public/                 # Static files
│   ├── javascripts/       # Client-side JS
│   └── stylesheets/       # CSS files
│
├── middleware.js           # Custom middleware
├── schemas.js             # Joi validation schemas
├── cloudinary/            # Cloudinary configuration
└── utils/                 # Utility functions
```

## 🔑 Key Features Explained

### Authentication & Authorization

- **Registration**: Email-based registration with password hashing
- **Login**: Session-based authentication
- **Protected Routes**: Middleware ensures users can only modify their own content
- **Authorization**: Campground and review ownership verification

### Image Upload

- Multiple images per campground
- Automatic upload to Cloudinary
- Image optimization and transformation
- Delete images from both database and Cloudinary

### Interactive Maps

- Leaflet.js integration with OpenStreetMap
- Geocoding support (Mapbox or OpenStreetMap Nominatim)
- Cluster maps showing all campgrounds
- Individual campground location markers

### Reviews System

- Star rating (1-5 stars)
- Text reviews
- Review ownership and authorization
- Delete reviews

## 🌐 Deployment

### Deploy to Render

1. **Push to GitHub**
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

2. **Create New Web Service on Render**
- Connect your GitHub repository
- Set build command: `npm install`
- Set start command: `node app.js`

3. **Add Environment Variables**
- `NODE_ENV` = `production`
- `DB_URL` = Your MongoDB Atlas connection string
- `SESSION_SECRET` = Random secret string
- `CLOUDINARY_CLOUD_NAME` = Your Cloudinary name
- `CLOUDINARY_KEY` = Your Cloudinary key
- `CLOUDINARY_SECRET` = Your Cloudinary secret

4. **Deploy!**

### Deploy to Heroku

```bash
# Install Heroku CLI
heroku login

# Create app
heroku create your-app-name

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set SESSION_SECRET=your_secret
heroku config:set DB_URL=your_mongodb_atlas_url
heroku config:set CLOUDINARY_CLOUD_NAME=your_name
heroku config:set CLOUDINARY_KEY=your_key
heroku config:set CLOUDINARY_SECRET=your_secret

# Deploy
git push heroku main
```

## 🧪 Testing

The application includes comprehensive error handling and validation:

- **Input Validation**: All forms are validated both client and server-side
- **Error Pages**: Custom error handling with meaningful messages
- **Security Testing**: Protected against common web vulnerabilities
- **Session Management**: Secure session handling with MongoDB store

## 🐛 Troubleshooting

### Common Issues

**Can't login after registration:**
- Make sure `SESSION_SECRET` is set in `.env`
- Clear browser cookies
- Check MongoDB connection

**Images not uploading:**
- Verify Cloudinary credentials in `.env`
- Check file size limits (max 10MB)
- Ensure correct file format (jpg, jpeg, png)

**Database connection errors:**
- For local: Ensure MongoDB is running
- For Atlas: Check IP whitelist and connection string
- Use `mongodb+srv://` format for Atlas

**Session issues in production:**
- Ensure `trust proxy` is enabled for HTTPS
- Verify `SESSION_SECRET` is set
- Check cookie settings

## 📚 API Routes

### Authentication
- `GET /register` - Registration form
- `POST /register` - Create new user
- `GET /login` - Login form
- `POST /login` - Authenticate user
- `GET /logout` - Logout user

### Campgrounds
- `GET /campgrounds` - List all campgrounds
- `GET /campgrounds/new` - New campground form (auth required)
- `POST /campgrounds` - Create campground (auth required)
- `GET /campgrounds/:id` - Show campground details
- `GET /campgrounds/:id/edit` - Edit form (auth + ownership required)
- `PUT /campgrounds/:id` - Update campground (auth + ownership required)
- `DELETE /campgrounds/:id` - Delete campground (auth + ownership required)

### Reviews
- `POST /campgrounds/:id/reviews` - Create review (auth required)
- `DELETE /campgrounds/:id/reviews/:reviewId` - Delete review (auth + ownership required)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👏 Acknowledgments

- **Colt Steele** - Original project from [The Web Developer Bootcamp](https://www.udemy.com/course/the-web-developer-bootcamp/)
- **Bootstrap** - For the responsive UI framework
- **Cloudinary** - For image hosting and management
- **MongoDB** - For the database solution
- **OpenStreetMap** - For map tiles and geocoding

## 📧 Contact

Nahom Mulugeta - nmbaby55@gmail.com

Project Link: [https://github.com/Nmbaby/yelpcamp](https://github.com/Nmbaby/yelpcamp)

Live Demo: [https://yelpcamp-1-qe7z.onrender.com](https://yelpcamp-1-qe7z.onrender.com)

---

## 🎯 Future Enhancements

- [ ] User profiles with avatar upload
- [ ] Campground search and filtering
- [ ] Sorting options (price, rating, date)
- [ ] Pagination for campgrounds list
- [ ] Email verification for registration
- [ ] Password reset functionality
- [ ] Favorite/bookmark campgrounds
- [ ] User notifications
- [ ] Advanced map filters
- [ ] Weather integration
- [ ] Booking system
- [ ] Social media sharing

---

**Built with ❤️ by Nahom Mulugeta**

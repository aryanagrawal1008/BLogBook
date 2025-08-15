const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const multer = require('multer')
const path = require('path')
const User = require('../models/user')
const Post = require('../models/post')

const jwtSecret = process.env.JWT_SECRET || 'yoursecretkey'

function authenticateToken(req, res, next) {
  const token = req.cookies.token
  if (!token) return res.redirect('/admin')

  jwt.verify(token, jwtSecret, (err, decoded) => {
    if (err) return res.redirect('/admin')
    req.user = { _id: decoded.userId }
    res.locals.isAuthenticated = true
    next()
  })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/')
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname))
  }
})
const upload = multer({ storage })

router.get('/', (req, res) => {
  const error = req.session.error
  delete req.session.error
  res.render('admin/index', { title: 'Admin Login', description: 'Login to manage your posts', error })
})

router.get('/register', authenticateToken, (req, res) => {
  const error = req.session.error
  delete req.session.error
  res.render('admin/register', { title: 'Register', description: 'Create a new admin account', error })
})

router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body
    const existingUser = await User.findOne({ username })
    if (existingUser) {
      req.session.error = 'Username already taken'
      return res.redirect('/admin/register')
    }
    const hashedPassword = await bcrypt.hash(password, 10)
    await User.create({ username, password: hashedPassword })
    res.redirect('/admin')
  } catch (err) {
    console.error(err)
    req.session.error = 'Internal Server Error'
    res.redirect('/admin/register')
  }
})

router.post('/', async (req, res) => {
  try {
    const { username, password } = req.body
    const user = await User.findOne({ username })
    if (!user) {
      req.session.error = 'Invalid username or password'
      return res.redirect('/admin')
    }
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      req.session.error = 'Invalid username or password'
      return res.redirect('/admin')
    }
    const token = jwt.sign({ userId: user._id }, jwtSecret, { expiresIn: '1h' })
    res.cookie('token', token, { httpOnly: true })
    res.redirect('/admin/dashboard')
  } catch (err) {
    console.error(err)
    req.session.error = 'Internal Server Error'
    res.redirect('/admin')
  }
})

router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const posts = await Post.find({ user: req.user._id }).sort({ date: -1 })
    res.render('admin/dashboard', { title: 'Dashboard', description: 'Your posts', posts })
  } catch (err) {
    console.error(err)
    res.status(500).send('Error loading dashboard')
  }
})

router.get('/add-post', authenticateToken, (req, res) => {
  res.render('admin/add-post', { title: 'Add Post', description: 'Create a new blog post' })
})

router.post('/add-post', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { title, description } = req.body
    const imagePath = req.file ? '/uploads/' + req.file.filename : null
    const newPost = new Post({ title, description, image: imagePath, user: req.user._id })
    await newPost.save()
    res.redirect('/admin/dashboard')
  } catch (err) {
    console.error('Error creating post:', err.message)
    res.status(500).send('Error creating post')
  }
})

router.get('/edit/:id', authenticateToken, async (req, res) => {
  try {
    const post = await Post.findOne({ _id: req.params.id, user: req.user._id })
    if (!post) return res.status(404).send('Post not found')
    res.render('admin/edit-post', { title: 'Edit Post', description: 'Update your blog post', post })
  } catch (err) {
    console.error(err)
    res.status(500).send('Error loading post')
  }
})

router.post('/edit/:id', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { title, description } = req.body
    const updatedData = { title, description }
    if (req.file) updatedData.image = '/uploads/' + req.file.filename
    await Post.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, updatedData)
    res.redirect('/admin/dashboard')
  } catch (err) {
    console.log('Error updating post:', err)
    res.status(500).send('Error updating post')
  }
})

router.post('/delete/:id', authenticateToken, async (req, res) => {
  try {
    await Post.findOneAndDelete({ _id: req.params.id, user: req.user._id })
    res.redirect('/admin/dashboard')
  } catch (err) {
    console.error(err)
    res.status(500).send('Error deleting post')
  }
})

router.get('/logout', (req, res) => {
  res.clearCookie('token')
  res.redirect('/admin')
})

module.exports = router

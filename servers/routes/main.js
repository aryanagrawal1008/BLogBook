const express = require('express')
const postSchema = require('../models/post.js')
const userSchema = require('../models/user.js')

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const locals = { title: 'Blog', description: 'Blog' }
    let perPage = 6
    let page = req.query.page || 1

    const posts = await postSchema.aggregate([{ $sort: { createdAt: -1 } }])
      .skip(perPage * page - perPage)
      .limit(perPage)
      .exec()

    const count = await postSchema.countDocuments({})
    const nextPage = parseInt(page) + 1
    const hasNextPage = nextPage <= Math.ceil(count / perPage)

    res.render('index', {
      locals,
      posts,
      current: page,
      nextPage: hasNextPage ? nextPage : null,
      currentRoute: '/',
      user: req.user
    })
  } catch (err) {
    console.log(err)
  }
})

router.get('/post/:id', async (req, res) => {
  try {
    const slug = req.params.id
    const data = await postSchema.findById({ _id: slug })

    const locals = {
      title: data.title,
      description: 'Simple Blog created with NodeJs, Express & MongoDb.'
    }

    res.render('post', {
      locals,
      data,
      currentRoute: `/post/${slug}`
    })
  } catch (err) {
    console.log(err)
  }
})

router.post('/search', async (req, res) => {
  try {
    const locals = {
      title: 'Seach',
      description: 'Simple Blog created with NodeJs, Express & MongoDb.'
    }

    const searchTerm = req.body.searchTerm
    const searchNoSpecialChar = searchTerm.replace(/[^a-zA-Z0-9 ]/g, '')

    const posts = await postSchema.find({
      $or: [
        { title: { $regex: new RegExp(searchNoSpecialChar, 'i') } },
        { description: { $regex: new RegExp(searchNoSpecialChar, 'i') } }
      ]
    })

    res.render('search', {
      posts,
      locals,
      currentRoute: '/'
    })
  } catch (err) {
    console.log(err)
  }
})

router.get('/about', (req, res) => {
  const locals = {
    title: 'About',
    description: 'Simple Blog created with NodeJs, Express & MongoDb.'
  }
  res.render('about', {
    locals,
    currentRoute: '/about'
  })
})

module.exports = router

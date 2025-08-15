require('dotenv').config()
const express = require('express')
const expressLayouts = require('express-ejs-layouts')
const connectDB = require('./servers/config/db.js')
const cookieParser = require('cookie-parser')
const session = require('express-session')
const MongoStore = require('connect-mongo')
const verifyToken = require('./middleware/auth')

const app = express()
const PORT = process.env.PORT || 3000

connectDB()

app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(express.static('public'))
app.use(expressLayouts)
app.use(cookieParser())
app.use(verifyToken)

app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI })
}))

app.use((req, res, next) => {
  res.locals.user = req.user || null
  next()
})

app.set('layout', './layouts/main')
app.set('view engine', 'ejs')

app.use('/', require('./servers/routes/main.js'))
app.use('/admin', require('./servers/routes/admin.js'))

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`)
})

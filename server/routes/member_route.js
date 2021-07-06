const { User } = require("./models/User");
const bodyParser = require("body-parser");
const express = require("express");
const router = express.Router();
const config = require("./config/key");
const cookieParser = require("cookie-parser");
const { auth } = require("./middleware/auth");


router.post("/api/users/signup", (req, res) => {
    const user = new User(req.body);
  
    user.save((err, userInfo) => {
      if (err) return res.json({ success: false, err });
      return res.status(200).json({ success: true });
    });
  });
  
  router.post("/api/users/login", (req, res) => {
    // 요청된 이메일을 데이터베이스에서 있는지 찾는다.
    User.findOne({ email: req.body.email }, (err, user) => {
      if (!user) {
        return res.json({
          loginSuccess: false,
          message: "제공된 이메일에 해당하는 유저가 없습니다.",
        });
      }
      // 요청된 이메일이 데이터베이스에 있다면 비밀번호가 맞는 비밀번호인지 확인한다.
      user.comparePassword(req.body.password, (err, isMatch) => {
        if (!isMatch)
          return res.json({
            loginSuccess: false,
            message: "비밀번호가 틀렸습니다.",
          });
        // 비밀번호까지 맞다면 토큰을 생성한다.
        user.generateToken((err, user) => {
          if (err) return res.status(400).send(err);
  
          // 토큰을 저장한다. 어디에? 쿠키, 로컬 스토리지 등
          res
            .cookie("x_auth", user.token)
            .status(200)
            .json({ loginSuccess: true, userId: user._id });
        });
      });
    });
  });
  
  router.get("/api/users/auth", auth, (req, res) => {
    // 여기까지 미들웨어를 통과해왔다는 것은 Authentication이 true라는 말이다.
    res.status(200).json({
      _id: req.user._id,
      isAdmin: req.user.role === 0 ? false : true,
      isAuth: true,
      email: req.user.email,
      name: req.user.name,
      lastname: req.user.lastname,
      role: req.user.role,
      image: req.user.image,
    });
  });
  
  router.get("/api/users/logout", auth, (req, res) => {
    User.findOneAndUpdate({ _id: req.user._id }, { token: "" }, (err, user) => {
      if (err) return res.json({ success: false, err });
      return res.status(200).send({ success: true });
    });
  });
const express =require("express")
const mongoose=require("mongoose")
const cors=require("cors")
const bcrypt=require("bcrypt")
const jwt=require("jsonwebtoken")
const cookieParser=require("cookie-parser")
const multer=require("multer")
const path=require("path")
const UserModel=require("./models/UserModel")
const PostModel=require('./models/PostModel')
require('dotenv').config()

//25Ea3BDRNE9Pq65z
//mdthoufiq120104

const app=express()
app.use(express.json())
app.use(cors({
    origin:['http://localhost:5173'],
    methods:["GET","POST","PUT","DELETE"],
    credentials:true
}))
app.use(cookieParser())
app.use(express.static('public'))

const verifyuser=(req,res,next)=>{
    const token=req.cookies.token;
    if(!token){
        return res.json("The token is missing")
    }else{
        jwt.verify(token,process.env.KEY,(err,decoded)=>{
            if(err){
                return res.json("the token is wrong")
            }else{
                req.email=decoded.email;
                req.name=decoded.name;
                next()
            }
        })
    }
}

app.get('/',verifyuser,(req,res)=>{
    return res.json({email:req.email,name:req.name})
})

app.post('/register',(req,res)=>{
    const {name,email,password}=req.body;
    bcrypt.hash(password,10)
    .then(hash=>{
        UserModel.create({name,email,password:hash})
        .then(user=>res.json(user))
        .catch(err=>res.json(err))
    }).catch(err=>console.log(err))
    
})

app.post('/login',(req,res)=>{
    const {email,password}=req.body;
    UserModel.findOne({email:email})
    .then(user=>{
        if(user){
            bcrypt.compare(password,user.password,(err,response)=>{
                if(response){
                    const token=jwt.sign({email:user.email,name:user.name},
                        process.env.KEY,{expiresIn:'1d'}
                    )
                    res.cookie('token',token)
                    return res.json("Success")
                }else{
                    return res.json("Password is incorrect")
                }
            })
        }else{
            res.json("User not exist")
        }
    })
})

const storage=multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,'Public/Images')
    },
    filename:(req,file,cb)=>{
        cb(null,file.fieldname+"_"+Date.now()+path.extname(file.originalname))
    }
})
const upload=multer({
    storage:storage
})

app.post('/create',verifyuser,upload.single('file'),(req,res)=>{
    PostModel.create({title:req.body.title,description:req.body.description,file:req.file.filename,email:req.body.email})
    .then(result=>res.json("Success"))
    .catch(err=>res.json(err))

})

app.get('/getposts',(req,res)=>{
    PostModel.find()
    .then(posts=>res.json(posts))
    .catch(err=>res.json(err))
})

app.get('/getpostbyid/:id',(req,res)=>{
    const id=req.params.id
    PostModel.findById({_id:id})
    .then(post=>res.json(post))
    .catch(err=>res.json(err))
})

app.put('/editpost/:id',(req,res)=>{
    const id=req.params.id;
    PostModel.findByIdAndUpdate({_id:id},{title:req.body.title,description:req.body.description})
    .then(result=>res.json("Success"))
    .catch(err=>res.json(err))
})

app.delete('/deletepost/:id',(req,res)=>{
    PostModel.findByIdAndDelete({_id:req.params.id})
    .then(result=>res.json("Success"))
    .catch(err=>console.log(err))
})

app.get('/logout',(req,res)=>{
    res.clearCookie('token')
    return res.json("Success")
})
//blog

mongoose.connect(process.env.MONGO_URL)
.then(()=>console.log("Mongodb is connect.."))
.catch((err)=>console.log(err))

const port =process.env.PORT;

app.listen(port,()=>{
    console.log("Server is Running")
})
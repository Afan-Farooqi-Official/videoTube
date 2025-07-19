import multer from "multer"

// You’re telling multer how and where to store the uploaded files — on your disk (local computer).
const storage = multer.diskStorage({
  
    // cb is callback, ye jo file hai ye middleware ki help sy ati hai
    /* 
      📁 This sets the folder where uploaded files should go.
      ➡️ In this case: ./public/temp
      🗂️ cb(null, folder) tells multer there's no error, and here’s the destination.
     */
    destination: function (req, file, cb) {
        cb(null, './public/temp')
    },

    /*
      📛 This sets the file name for the saved file.
      ➡️ It keeps the original name like "photo.png". 
    */
    filename: function (req, file, cb) {
        cb(null, file.originalname)
        // console.log(fieldname);
    }

})

// You create an upload middleware using the defined storage config.
export const upload = multer({ 
    // storage: storage //or
    storage,
})
import mongoose, {Schema} from "mongoose"

// This allows us to use .aggregatePaginate() on the Video model
import mongooseAggregatePeginate from "mongoose-aggregate-paginate-v2"

const videoSchema = new Schema(
    {
        videoFile: {
            type: String, //cloudinary url
            required: true
        },
        thumbnail: {
            type: String, //cloudinary url
            required: true
        },
        title: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        duration: {
            type: Number,       // we get from cloudinary
            // required: true
        },
        views: {
            type: Number,
            default: 0
        },
        isPublished: {
            type: Boolean,
            default: true
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        videos: [{
            type: Schema.Types.ObjectId,
            ref: "Video"
        }]
    },
    {
        timestamps: true
    }
)

// middleware to plugin, we also use now aggregation query
// Enable pagination on aggregation results

videoSchema.plugin(mongooseAggregatePeginate)

export const Video = mongoose.model("Video", videoSchema)
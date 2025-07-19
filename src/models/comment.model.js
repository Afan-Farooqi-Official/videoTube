import mongoose, {Schema} from "mongoose"
import mongooseaggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentsSchema = new Schema(
    {
        content: {
            type: String,
            required: true,
        },
        video: {
            type: Schema.Types.ObjectId,
            ref: "Video",
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    {timestamps: true}
)

commentsSchema.plugin(mongooseaggregatePaginate);

export const Comment = mongoose.model("Comment", commentsSchema);
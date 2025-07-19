import mongoose, {Schema} from "mongoose"
import { ref } from "process"

const subscriptionSchema = new Schema({
    subscriber: {
        type: Schema.Types.ObjectId,    // one how is subscibing
        ref: "User"
    },
    channel: {
        type: Schema.Types.ObjectId,    // one to whom 'subscriber' is subscribing
        ref: "User"
    }
},
{
    timestamps: true
})

export const Subscription = mongoose.model("Subscription", subscriptionSchema)

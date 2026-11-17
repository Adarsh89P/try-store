import { Schema, model } from "mongoose";

const lineSchema = new Schema(
  {
    slug: String,
    name: String,
    colour: String,
    size: String,
    qty: Number,
    unitPriceInr: Number,
    image: String,
  },
  { _id: false },
);

const orderSchema = new Schema(
  {
    orderId: { type: String, required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: "User", index: true },
    guestToken: { type: String },
    email: { type: String, required: true },
    items: { type: [lineSchema], required: true },
    address: {
      name: String, phone: String, line1: String, line2: String, city: String, state: String, pincode: String,
    },
    payment: {
      method: { type: String, enum: ["cod", "online"], required: true },
      status: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
      razorpayOrderId: String,
      razorpayPaymentId: String,
    },
    subtotalInr: Number,
    deliveryInr: Number,
    totalInr: Number,
    status: { type: String, enum: ["placed", "confirmed", "shipped", "delivered", "cancelled"], default: "placed" },
  },
  { timestamps: true },
);

export const Order = model("Order", orderSchema);

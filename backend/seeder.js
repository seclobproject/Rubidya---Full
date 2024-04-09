import connectDB from "./config/db.js";
import users from "./data/users.js";
import revenue from "./data/revenue.js";
import Revenue from "./models/revenueModel.js";
import User from "./models/userModel.js";
import Package from "./models/packageModel.js";

await connectDB();

const importData = async () => {
  try {
    await User.deleteMany();
    const createdUsers = await User.insertMany(users);

    await Revenue.deleteMany();
    const createdRevenue = await Revenue.insertMany(revenue);

    // const updatePackage = await Package.updateMany({}, { $set: { users: [] } });

    console.log("Data cleared");
    process.exit();
  } catch (error) {
    console.error(`${error}`);
    process.exit(1);
  }
};

if (process.argv[2] === "-id") {
  destroyData();
} else {
  importData();
}

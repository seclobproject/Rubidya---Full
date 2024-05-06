import asyncHandler from "../middleware/asyncHandler.js";
import User from "../models/userModel.js";
import Package from "../models/packageModel.js";
import axios from "axios";

//Api to exchange from rubedya exchange to wallet amount
export const creditWallet = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const { amount } = req.body;

    //Fetching user data
    const user = await User.findById(userId);

    if (
        !user.payId ||
        !user.uniqueId ||
        user.payId === "" ||
        user.uniqueId === ""
    ) {
        res.status(400);
        throw new Error("Please send the payId and uniqueId");
    }

    // API to deduct balance
    const response = await axios.post(
        "https://pwyfklahtrh.rubideum.net/basic/deductBalanceAuto",
        {
            payId: user.payId,
            uniqueId: user.uniqueId,
            amount: amount,
            currency: "RBD",

        }
    );

    const dataFetched = response.data;
    if (dataFetched.success === 1) {

        //Updating users data by updating the wallet amount
        let updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                $inc: { walletAmount: amount },

                $push: {
                    transactions: {
                        amount: amount,
                        fromWhom: 'Rubideum',
                        typeofTransaction: 'credit',
                        date: Date.now(),
                        kind: 'Rubideum to wallet'
                    }
                }
            },
            { new: true }
        );

        if (updatedUser) {
            res.status(200).json({
                sts: "01",
                msg: "Amount Succesfully credited.",

            });
        }
    } else {
        res.status(400).json({
            sts: "00",
            msg: "Deducting Rubideum failed. Check your Rubideum balance",
        });
    }
});


// Updating payId of a user
export const editPayId = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { payId } = req.body;

    //Fetching data of a user
    const existingUser = await User.findById(userId);
    if (existingUser) {
        const user = await User.findByIdAndUpdate(
            userId,
            { payId },
            { new: true }
        );
        if (user) {
            res.status(200).json({ sts: "01", msg: "PayId updated successfully" });
        } else {
            res.status(404).json({ sts: "00", msg: "User not found" });
        }
    } else {
        res.status(404).json({ sts: "00", msg: "User not found" });
    }
});

//Api to subscribe a package
export const subscription = asyncHandler(async (req, res) => {

    const userId = req.user._id;

    const { amount, packageId } = req.body;


    //Fetching users data
    const user = await User.findById(userId);

    // Get the package
    const selectedPackage = await Package.findById(packageId);

    if (!selectedPackage) {
        res.status(400).json({ sts: "00", msg: "Please select a valid package" });
    } else {

        // Check if the user has selected the package before.
        if (!user.packageName.includes(selectedPackage.packageSlug)) {
            //Checking if user have enough balance to purchase the package


            // Get current rubidya market place
            const response = await axios.get(
                "https://pwyfklahtrh.rubideum.net/api/endPoint1/RBD_INR"
            );

            const currentValue = response.data.data.last_price;

            let convertedAmount
            if (currentValue) {
                convertedAmount = amount / currentValue;

            } else {
                res.status(400).json({ sts: "00", msg: "Error in converting" });
            }

            if (user.walletAmount >= convertedAmount) {

                //Deducting purchased amount from walletAmount of user
                let updatedUser = await User.findByIdAndUpdate(
                    userId,
                    {
                        $inc: { walletAmount: -convertedAmount },

                        // $push: {
                        //     fundHistory: {
                        //         amount: amount,
                        //         toWhom: 'Package',
                        //         typeofTransaction: 'debit',
                        //         date: Date.now()
                        //     }
                        // }
                    },
                    { new: true }
                );



                if (updatedUser) {

                    res.status(200).json({ sts: "01", msg: "Package purchased successfully ", deductedAmount: convertedAmount });
                }

            } else {
                res.status(404).json({ sts: "00", msg: "Sorry,you dont have enough wallet amount to purchase the package" });
            }
        } else {
            res.status(400).json({
                sts: "00",
                msg: "You have already selected this package",
            });
        }
    }

});

//Api to withdraw amount from wallet
export const withdraw = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const { amount, recievresNo } = req.body;

    //Fetching users data
    const user = await User.findById(userId);

    //Checking if user have enough balance to transfer
    if (user.walletAmount >= amount) {

        const reciever = await User.findOne({ phone: recievresNo })
        // console.log('RECIEVER', reciever._id)
        if (reciever) {

            //Deducting amount from users account
            let updatedUser = await User.findByIdAndUpdate(
                userId,
                {
                    $inc: { walletAmount: -amount },

                    $push: {
                        transactions: {
                            amount: amount,
                            toWhom: reciever.firstName + ' ' + reciever.lastName,
                            typeofTransaction: 'debit',
                            date: Date.now(),
                            kind: 'wallet to wallet'
                        }
                    }
                },
                { new: true }
            );

            //Credit amount of transfered user
            let updatedRecievedUser = await User.findByIdAndUpdate(
                reciever._id,
                {
                    $inc: { walletAmount: amount },

                    $push: {
                        transactions: {
                            amount: amount,
                            fromWhom: user.firstName + ' ' + user.lastName,
                            typeofTransaction: 'credit',
                            date: Date.now(),
                            kind: 'wallet to wallet'
                        }
                    }
                },
                { new: true }
            );

            if (updatedUser && updatedRecievedUser) {
                res.status(200).json({ sts: "01", msg: "Amount transfered  successfully " });
            }

        } else {
            res.status(404).json({ sts: "00", msg: "User not found to transfer" });
        }

    } else {
        res.status(404).json({ sts: "00", msg: "Sorry,you dont have enough wallet amount to transfer" });
    }
});

//Pay to rubideum
export const payToRubideum = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const { amount } = req.body

    //Fetching users data
    let user = await User.findById(userId);

    if (user) {

        //Adding amount to rubideum exchange
        const response = await axios.post(
            "https://pwyfklahtrh.rubideum.net/basic/creditBalanceAuto",
            {
                payId: user.payId,
                uniqueId: user.uniqueId,
                amount: amount,
                currency: "RBD"


            });

        if (response.data.success === 1) {

            //Deducting amount from users wallet amount
            let updatedUser = await User.findByIdAndUpdate(
                userId,
                {
                    $inc: { walletAmount: -amount },

                    $push: {
                        transactions: {
                            amount: amount,
                            toWhom: 'rubideum',
                            typeofTransaction: 'debit',
                            date: Date.now(),
                            kind: 'pay to rubideum'
                        }
                    }
                },
                { new: true }
            );

            if (updatedUser) {

                res.status(200).json({ sts: "01", msg: "Amount added to rubideum exchange succesfully " });
            }

        } else {
            res
                .status(400)
                .json({ sts: "00", msg: "Failed to add  amount to rubideum exchange" });
        }

    } else {
        res.status(404).json({ sts: "00", msg: "No user found" });
    }


});


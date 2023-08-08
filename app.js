import dotenv from "dotenv";
dotenv.config();

import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import _ from "lodash";
import getDayToLocale from "./date.js";

const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

const port = 3000;

mongoose.connect(process.env.MONGO_DB);
// // Local database
// mongoose.connect("mongodb://0.0.0.0:27017/toDoListEJSDB");

// Schema and model for Home Page
const itemsSchema = new mongoose.Schema({
    name: String
});
const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "Welcome to your to do list!"
});
const item2 = new Item({
    name: "Hit the ➕ button to add a new item."
});
const item3 = new Item({
    name: "⬅️ Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

// Schema and model for Custom Pages
const listSchema = new mongoose.Schema({
    name: String,
    items: [itemsSchema]
});
const List = mongoose.model("List", listSchema);

app.route("/")
.get((req, res) => {
    Item.find().then((foundItems) => {
        if (foundItems.length === 0) {
            // Add Default Items to database list if Home Page is empty
            Item.insertMany(defaultItems).then(() => {
                res.redirect("/");
            }).catch((error) => {
                console.log(error);
            });
        }
        else {
            // Show an existing database list if Home Page is not empty
            let day = getDayToLocale();

            res.render("list", {
                listTitle: day,
                newListItems: foundItems,
            });
        }
    });
})
.post((req, res) => {
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName
    });

    let day = getDayToLocale();

    if (listName === day) {
        // Add data to Item Collection in database
        item.save();
        res.redirect("/");
    }
    else {
        // Add the data to array of items of List Collection in database
        List.findOne({name: listName}).then((foundList) => {
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        });
    }
});

app.post("/delete", (req, res) => {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    let day = getDayToLocale();
    
    if (listName === day) {
        // Remove data from Item Collection (Home Page) in database
        Item.findByIdAndDelete(checkedItemId).then(() => {
            res.redirect("/");
        }).catch((error) => {
            console.log(error);
        });
    }
    else {
        // Remove data from array of items of List Collection in database
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}).then((foundList) => {
            res.redirect("/" + listName);
        }).catch((error) => {
            console.log(error);
        });
    }
});

app.get("/:customListName", (req, res) => {
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({name: customListName}).then((foundList) => {
        if (!foundList) {
            // Create a new List
            const list = new List({
                name: customListName,
                items: defaultItems
            });
            list.save();

            res.redirect("/" + customListName);
        }
        else {
            // Show an existing List
            res.render("list", {
                listTitle: foundList.name,
                newListItems: foundList.items,
            });
        }
    });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}.`);
});
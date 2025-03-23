const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const axios = require("axios");
const cron = require("node-cron");
const chalk = require("chalk");
const striptags = require("striptags"); // Remove HTML from descriptions

const app = express();
const PORT = 5000;
const API_URL = "https://remoteok.io/api";

// Middleware
app.use(express.json());
app.use(cors());

// MongoDB Connection
mongoose.connect("mongodb://127.0.0.1:27017/jobDB");
const db = mongoose.connection;
db.on("error", console.error.bind(console, chalk.red("❌ MongoDB Connection Error:")));
db.once("open", () => console.log(chalk.green("✅ MongoDB Connected!")));

// Job Schema
const jobSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  title: { type: String, required: true },
  company: { type: String, required: true },
  location: String,
  description: String,
  applyLink: String,
  salary: String
});

const Job = mongoose.model("Job", jobSchema);

// **Fetch and Store Jobs**
const fetchAndStoreJobs = async () => {
  try {
    console.log(chalk.blue("🔄 Fetching jobs from API..."));
    const response = await axios.get(API_URL);

    // **Check if API response is valid**
    if (!response.data || !Array.isArray(response.data)) {
      throw new Error("Invalid API response format");
    }

    console.log(chalk.yellow(`🔍 API returned ${response.data.length} items`));

    const jobs = response.data.slice(1); // Skip metadata
    const validJobs = jobs.map(job => ({
      id: job.id,
      title: job.position || job.title || "No Title",
      company: job.company || "Unknown Company",
      location: job.location || "Remote",
      description: striptags(job.description || ""), // Strip HTML tags
      applyLink: job.url || "",
      salary: job.salary ? `${job.salary_min} - ${job.salary_max}` : "Not specified"
    })).filter(job => job.id && job.title && job.company);

    if (validJobs.length === 0) {
      console.log(chalk.yellow("⚠ No valid jobs found!"));
      return;
    }

    // **Save Jobs to MongoDB**
    await Job.deleteMany();
    await Job.insertMany(validJobs);
    console.log(chalk.green(`✅ ${validJobs.length} jobs saved to MongoDB!`));

  } catch (error) {
    console.error(chalk.red("❌ Error fetching jobs:"), error.message);
  }
};

// **Run job fetch on server start**
fetchAndStoreJobs();

// **Schedule job updates every hour**
cron.schedule("0 * * * *", fetchAndStoreJobs);
console.log(chalk.cyan("🔁 Job update scheduled every hour!"));

// **API Endpoints**
app.get("/jobs", async (req, res) => {
  try {
    const jobs = await Job.find();
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: "Error fetching jobs" });
  }
});

// **Manual Refresh Endpoint**
app.get("/refresh-jobs", async (req, res) => {
  try {
    await fetchAndStoreJobs();
    res.json({ message: "Jobs refreshed successfully!" });
  } catch (error) {
    res.status(500).json({ error: "Failed to refresh jobs" });
  }
});

// **Start Server**
app.listen(PORT, () => {
  console.log(chalk.magenta(`🚀 Server running at http://192.168.100.51:${PORT}`));
});

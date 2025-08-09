// controllers/categoryController.js
import asyncHandler from "express-async-handler";
import Category from "../models/Category.js";

// @desc    Create a new category
// @route   POST /api/categories
// @access  Private/Admin
const createCategory = asyncHandler(async (req, res) => {
  // Check if user is admin
  if (req.user.userType !== "admin") {
    res.status(403);
    throw new Error("Only admin users can create categories");
  }

  const { name, description } = req.body;

  if (!name) {
    res.status(400);
    throw new Error("Category name is required");
  }

  const categoryExists = await Category.findOne({ name });
  if (categoryExists) {
    res.status(400);
    throw new Error("Category already exists");
  }

  const category = await Category.create({
    name,
    description,
    createdBy: req.user._id,
  });

  res.status(201).json(category);
});

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true });
  res.json(categories);
});

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private/Admin
const updateCategory = asyncHandler(async (req, res) => {
  // Check if user is admin
  if (req.user.userType !== "admin") {
    res.status(403);
    throw new Error("Only admin users can update categories");
  }

  const { name, description, isActive } = req.body;

  const category = await Category.findById(req.params.id);
  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }

  if (name) {
    const categoryExists = await Category.findOne({
      name,
      _id: { $ne: req.params.id },
    });
    if (categoryExists) {
      res.status(400);
      throw new Error("Category name already in use");
    }
    category.name = name;
  }

  if (description) category.description = description;
  if (isActive !== undefined) category.isActive = isActive;

  const updatedCategory = await category.save();
  res.json(updatedCategory);
});

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
const deleteCategory = asyncHandler(async (req, res) => {
  // Check if user is admin
  if (req.user.userType !== "admin") {
    res.status(403);
    throw new Error("Only admin users can delete categories");
  }

  const category = await Category.findById(req.params.id);
  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }

  // Check if category is used in any tenders
  const tenderCount = await Tender.countDocuments({ category: req.params.id });
  if (tenderCount > 0) {
    res.status(400);
    throw new Error("Cannot delete category as it is used in tenders");
  }

  await category.remove();
  res.json({ message: "Category removed" });
});

export { createCategory, getCategories, updateCategory, deleteCategory };

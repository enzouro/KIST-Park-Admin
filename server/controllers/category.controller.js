import Category from '../mongodb/models/category.js';

// Get all categories
const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find({}).sort('category');
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch categories' });
  }
};

// Create a new category
const createCategory = async (req, res) => {
  try {
    const { category } = req.body;
    
    // Check if category already exists
    const existingCategory = await Category.findOne({ category });
    if (existingCategory) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    const newCategory = await Category.create({ category });
    res.status(201).json(newCategory);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create category' });
  }
};

// Update a category
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { category } = req.body;

    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      { category },
      { new: true }
    );

    if (!updatedCategory) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.status(200).json(updatedCategory);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update category' });
  }
};

// Delete a category
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedCategory = await Category.findByIdAndDelete(id);
    
    if (!deletedCategory) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete category' });
  }
};

export {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
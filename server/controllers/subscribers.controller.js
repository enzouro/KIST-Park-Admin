
import Subscriber from "../mongodb/models/subscribers.js";

const getAllSubscribers = async (req, res) => {
  try {
    // Changed to sort by sequence number in descending order
    const subscribers = await Subscriber.find({}).sort({ seq: -1 });
    res.status(200).json(subscribers);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch subscribers" });
  }
};

const createSubscriber = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Basic email validation on server side
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Check if subscriber already exists
    const existingSubscriber = await Subscriber.findOne({ email });
    if (existingSubscriber) {
      return res.status(400).json({ message: "Subscriber already exists" });
    }

    // Get the last sequence number
    const lastSubscriber = await Subscriber.findOne({}, {}, { sort: { seq: -1 } });
    const nextSeq = lastSubscriber ? lastSubscriber.seq + 1 : 1;

    // Create new subscriber with sequence number
    const newSubscriber = await Subscriber.create({
      email,
      seq: nextSeq,
      createdAt: new Date()
    });

    return res.status(201).json({
      success: true,
      message: "Successfully subscribed",
      data: newSubscriber
    });

  } catch (error) {
    return res.status(500).json({ 
      success: false,
      message: "Failed to create subscriber",
      error: error.message 
    });
  }
};


const deleteSubscriber = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Handle comma-separated IDs for multiple deletions
    const ids = id.split(',');
    const deletionResults = [];
    
    for (const singleId of ids) {
      try {
        const subscriberToDelete = await Subscriber.findById(singleId);
        
        if (!subscriberToDelete) {
          deletionResults.push({
            id: singleId,
            success: false,
            message: 'Subscriber not found'
          });
          continue;
        }

        // Delete the subscriber
        await Subscriber.findByIdAndDelete(singleId);
        deletionResults.push({
          id: singleId,
          success: true,
          message: 'Successfully deleted'
        });
      } catch (err) {
        deletionResults.push({
          id: singleId,
          success: false,
          message: 'Failed to delete'
        });
      }
    }

    // Check if any deletions were successful
    const successfulDeletions = deletionResults.filter(result => result.success);
    
    if (successfulDeletions.length === 0) {
      return res.status(404).json({
        message: 'No subscribers were deleted',
        results: deletionResults
      });
    }

    return res.status(200).json({
      message: `Successfully deleted ${successfulDeletions.length} ${successfulDeletions.length === 1 ? 'subscriber' : 'subscribers'}`,
      results: deletionResults
    });

  } catch (err) {
    console.error('Delete error:', err);
    return res.status(500).json({
      message: 'Server error while deleting subscribers',
      error: err.message
    });
  }
};

export {
  getAllSubscribers, 
  createSubscriber,
  deleteSubscriber
};
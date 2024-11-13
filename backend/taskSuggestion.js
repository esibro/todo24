const Todo = require('./todolist.js');  // Import the Todo model
const SAM = require('./sam'); // Import the SAM model
const User = require('./user.js');
const EmotibitData = require('./emotibitData.js');
const Suggestion = require('./suggestion'); 

// Variables to store baseline values
let BASELINE_HR;
let BASELINE_EDA;

// Function to fetch baseline values from the user table
async function loadBaselines() {
  try {
    const user = await User.findOne(); // Fetch the only user baseline data
    if (user) {
      BASELINE_HR = user.hr_baseline;
      BASELINE_EDA = user.eda_baseline;
      console.log("Baseline values loaded:", { BASELINE_HR, BASELINE_EDA });
    } else {
      throw new Error("User baseline data not found");
    }
  } catch (error) {
    console.error("Error loading baseline values:", error);
  }
}

// Load baselines when the module is loaded
loadBaselines();

// Function to analyze HR arousal
async function analyzeHRArousal() {
    try {
        // Fetch the latest HR value from EmotibitData
        const latestEmotibitData = await EmotibitData.findOne().sort({ timestamp: -1 });
        if (!latestEmotibitData) {
          console.error('No HR data found in EmotibitData.');
          return null; // Or handle this case as needed
        } 

        const currentHR = latestEmotibitData.hr;
        // Calculate arousal level based on the baseline
        const percentage = (currentHR / BASELINE_HR) * 100;
        //return percentage;
        let hrArousalLevel;
        
        if (percentage > 120) {
            hrArousalLevel = 9; // Very high arousal
          } else if (percentage > 110 && percentage <= 120) {
            hrArousalLevel = 7; // High Arousal
          } else if (percentage > 90 && percentage <= 110) {
            hrArousalLevel = 5 // Normal arousal
          } else if (percentage <= 90 && percentage > 80){
            hrArousalLevel = 3; // Low arousal
          } else if (percentage <= 80) {
            hrArousalLevel = 1; // Very low arousal
          }
    
        return hrArousalLevel;
    
      } catch (error) {
        console.error('Error fetching HR arousal data:', error);
        return null; // Or handle error as needed
      }
}

// Function to analyze EDA arousal
async function analyzeEDAArousal() {
    try {
        // Fetch the latest HR value from EmotibitData
        const latestEmotibitData = await EmotibitData.findOne().sort({ timestamp: -1 });
        if (!latestEmotibitData) {
          console.error('No EDA data found in EmotibitData.');
          return null; // Or handle this case as needed
        } 
    
        const currentEDA = latestEmotibitData.eda;
        // Calculate arousal level based on the baseline
        const percentage = (currentEDA / BASELINE_EDA) * 100;
        //return percentage;
        let edaArousalLevel;
        
        if (percentage > 170) {
          edaArousalLevel = 9; // Very high arousal
        } else if (percentage > 130 && percentage <= 170) {
            edaArousalLevel = 7; // High Arousal
        } else if (percentage > 80 && percentage <= 130) {
            edaArousalLevel = 5 // Normal arousal
        } else if (percentage <= 80 && percentage > 50){
            edaArousalLevel = 3; // Low arousal
        } else if (percentage <= 50) {
          edaArousalLevel = 1; // Very low arousal
        }

        return edaArousalLevel;
    
      } catch (error) {
        console.error('Error fetching EDA arousal data:', error);
        return null; // Or handle error as needed
      }
}

// Function to calculate the mean arousal level from HR and EDA
function calculatePhysiologicalArousal(hrArousalLevel, edaArousalLevel) {
    const physiologicalArousal = (hrArousalLevel + edaArousalLevel) / 2;
    return physiologicalArousal;
  }

  // Function to calculate trueArousal based on latest SAM and physiologicalArousal
async function calculateTrueArousal(physiologicalArousal) {
    try {
      // Fetch the latest arousal value from the SAM table
      const latestSAM = await SAM.findOne().sort({ timestamp: -1 });
  
      if (!latestSAM) {
        console.error('No SAM data found.');
        return null;  // Or handle the case when there is no SAM data
      }
  
      const samArousal = latestSAM.arousal;
  
      // Calculate the mean with physiological arousal
      const trueArousal = (physiologicalArousal + samArousal) / 2;
      return trueArousal;
  
    } catch (error) {
      console.error('Error fetching SAM data:', error);
      return null; 
    }
  }

  // Function to fetch the latest valence value from the SAM table
async function getValence() {
    try {
      // Fetch the latest SAM entry based on the timestamp
      const latestValence = await SAM.findOne().sort({ timestamp: -1 });
  
      if (!latestValence) {
        console.error('No SAM data found.');
        return null;  // Handle the case when there is no SAM data
      }
  
      // Retrieve the valence value from the latest SAM entry
      const trueValence = latestValence.valence;
      return trueValence;
  
    } catch (error) {
      console.error('Error fetching latest valence value:', error);
      return null;  // Handle error as needed
    }
  }

 // Function to save the suggestion details
async function saveSuggestion(trueArousal, trueValence, tasks) {
  try {
    const suggestion = new Suggestion({
      trueArousal,
      trueValence,
      suggestedTasks: tasks.map(task => ({ taskId: task.taskId, description: task.description })),
    });

    await suggestion.save();
    console.log('Suggestion saved successfully:', suggestion);
  } catch (error) {
    console.error('Error saving suggestion:', error);
  }
}

// Function to suggest tasks based on trueArousal and trueValence
async function suggestTask(trueArousal, trueValence) {
  try {
    let difficultyLevels = [];
    let message = '';

    // Determine difficulty levels and message based on conditions
    if (trueArousal > 7 && trueValence >= 1 && trueValence <= 9) {
      difficultyLevels = [1, 2];
      message = 'Seems like you have elevated stress levels. How about doing an easier task?';

    } else if (trueArousal < 4 && trueValence >= 1 && trueValence <= 4) {
      difficultyLevels = [1, 2];
      message = 'Seems like you are very calm right now. How about something comfortable to start off with?';

    } else if (trueArousal < 3 && trueValence >= 5 && trueValence <= 9) {
      difficultyLevels = [1, 2];
      message = 'Seems like you are very calm right now. How about something comfortable to start off with?';

    } else if (trueArousal >= 4 && trueArousal <= 7 && trueValence >= 1 && trueValence < 5) {
      // Prioritize tasks with difficulty 3 fallback to 1 or 2 if no matches
      difficultyLevels = [[3], [1, 2]];
      message = 'Seems like you are in good condition for a moderate task. How about one of these?';

    } else if (trueArousal >= 3 && trueArousal <= 7 && trueValence >= 5 && trueValence <= 9) {
      // Prioritize tasks with difficulty 5 or 4, fallback to 3, 1, or 2 if no matches
      difficultyLevels = [[5, 4], [3], [1, 2]];
      message = 'Seems like you can cope with any task right now! How about starting with one of these?';

    } else {
      console.log('Arousal and valence levels do not match task suggestion criteria. Suggesting a time out.');
      return { tasks: [], message: 'Current arousal and valence levels suggest taking a time out.' };
    }

     // Loop through the difficulty level groups and return the first match with done: false
     for (const levelGroup of difficultyLevels) {
      const tasks = await Todo.find(
        { difficulty: { $in: Array.isArray(levelGroup) ? levelGroup : [levelGroup] }, done: false },
        { taskId: 1, description: 1 }
      );
      if (tasks.length > 0) {
        console.log(`Suggested Tasks for difficulty levels ${levelGroup} with done: false:`, tasks);
        // Save the suggestion to the database
        await saveSuggestion(trueArousal, trueValence, tasks);

        return { tasks, message };
      }
    }

    // If no tasks found in the specified difficulty levels, suggest a time out
    console.log('No suitable tasks found. Suggesting a time out.');
    return { tasks: [], message: 'There are no suitable tasks right now. How about taking a break and enjoying a glass of tea?' };

  } catch (error) {
    console.error('Error suggesting tasks:', error);
    return { tasks: [], message: 'An error occurred while suggesting tasks.' };
  }
}

// Function to check if the user has at least two todos
async function checkForTodos(socket) {
  try {
      const todoCount = await Todo.countDocuments({});
      //console.log('Todo count:', todoCount);

      if (todoCount < 2) {
          // Notify the frontend if fewer than two todos
          socket.emit('noTodos', { message: 'Please create at least two tasks for task suggestions.' });
      } else {
          console.log('Enough todos exist');
          const hrArousalLevel = await analyzeHRArousal();
          console.log('HR Arousal Level: ', hrArousalLevel);
          const edaArousalLevel = await analyzeEDAArousal();
          console.log('EDA Arousal Level: ', edaArousalLevel);
          const physiologicalArousal = calculatePhysiologicalArousal(hrArousalLevel, edaArousalLevel);
          const trueArousal = await calculateTrueArousal(physiologicalArousal);
          const trueValence = await getValence();
          const suggestion = await suggestTask(trueArousal, trueValence);

          console.log('Task Suggestion: ', suggestion.message);
          if (suggestion.tasks.length > 0) {
              suggestion.tasks.forEach(task => {
                  console.log(`Suggested Task - ID: ${task.taskId}, Description: ${task.description}`);
              });
          }

          // Emit the suggestion data to the frontend
          socket.emit('taskSuggestion', { message: suggestion.message, tasks: suggestion.tasks });
      }
  } catch (error) {
      console.error('Error checking for todos:', error);
      socket.emit('noTodos', { message: 'Error checking tasks.' });
  }
}

module.exports = checkForTodos;
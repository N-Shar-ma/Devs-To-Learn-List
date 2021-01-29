const main = document.querySelector("main");
const taskTemplate = document.querySelector("[data-template='task']");
const taskListSectionTemplate = document.querySelector("[data-template='task-list-section']");
let taskListTitles = ["To Casually Google", "To Learn Basics", "To Learn In Depth", "To Practise in a Project", "To Keep Up With In Future"];
const clearButton = document.querySelector(".clear-button");
let submitTaskButtons, inputBoxes, taskLists;

let idCount = JSON.parse(localStorage.getItem("idCount")) || 0;

let taskObjects = JSON.parse(localStorage.getItem("taskObjects")) || [];

loadTaskListSections();
loadStoredTasks();

function loadTaskListSections()
{
	for(let i = 0; i < taskListTitles.length; i++)
	{
		const taskListSection = taskListSectionTemplate.content.cloneNode(true).querySelector(".task-list-section");
		taskListSection.querySelector(".task-list-title").innerText = taskListTitles[i];
		taskList = taskListSection.querySelector(".task-list");
		taskList.id = `task-list-${i+1}`;
		addTaskListDragEventListeners(taskList);
		filterButtons = Array.from(taskListSection.querySelectorAll(".filter-button"));
		filterButtons.forEach((filterButton) => {
			addFilterButtonFunctionality(filterButton);
		});
		main.append(taskListSection);
	}
	submitTaskButtons = Array.from(document.querySelectorAll(".submit-task-button"));
	inputBoxes = Array.from(document.querySelectorAll(".task-input"));
	taskLists = Array.from(document.querySelectorAll(".task-list"));
}

function addTaskListDragEventListeners(taskList)
{
	taskList.addEventListener("dragenter", (e) => {
		e.target.closest(".task-list").classList.add("dragged-over");
	});
	taskList.addEventListener("dragover", (e) => {
		e.preventDefault();
	});
	taskList.addEventListener("dragleave", (e) => {
		e.target.closest(".task-list").classList.remove("dragged-over");
	});
	taskList.addEventListener("drop", (e) => {
		const task = document.querySelector(".dragging");
		const taskList = e.target.closest(".task-list");
		taskList.append(task);
		taskList.classList.remove("dragged-over");
		const taskObject = getCorrespondingObject(task.id);
		taskObject.taskListId = taskList.id;
		saveToStorage();
	});
}

function addFilterButtonFunctionality(filterButton)
{
	filterButton.addEventListener("click", ()=>{
		const taskList = filterButton.parentElement.parentElement.querySelector(".task-list");
		if(filterButton.classList.contains("active"))
		{
			filterButton.classList.remove("active");
			filterButton.parentElement.querySelector("[data-show='all']").classList.add("active");
			filterTasks("all", taskList);
		}
		else
		{
			currentFilterButtons = Array.from(filterButton.parentElement.querySelectorAll(".filter-button"))
			currentFilterButtons.forEach((button)=>{
				button.classList.remove("active");
			});
			filterButton.classList.add("active");
			filterTasks(filterButton.getAttribute("data-show"), taskList);
		}
	});	
}

function filterTasks(dataShow, taskList)
{
	taskList.className = "task-list";
	taskList.classList.add(dataShow);
}

function loadStoredTasks()
{
	taskObjects.forEach((taskObject)=>{
		createTaskFromObject(taskObject);
	});
}

function createTaskFromObject(taskObject)
{
	task = createNewTask();
	task.id = taskObject.id;
	const label = task.querySelector("label");
	const checkbox = task.querySelector("input");
	label.htmlFor = taskObject.labelId;
	checkbox.id = taskObject.checkboxId;
	if(taskObject.done)
	{
		task.querySelector("input").checked = true;
		task.classList.add("done");
	}
	updateTaskLabel(task.querySelector("label"), taskObject.label);
	addTaskToList(task, document.querySelector(`#${taskObject.taskListId}`), false);	
}

submitTaskButtons.forEach((submitTaskButton) => {
	submitTaskButton.addEventListener("click", () => {
		const enterTextArea = submitTaskButton.parentElement;
		submitTask(enterTextArea);
	})
});

inputBoxes.forEach((inputBox) => {
	inputBox.addEventListener("keyup", (e) => {
		if(e.key === "Enter")
		{
			const enterTextArea = inputBox.parentElement;
			submitTask(enterTextArea);			
		}
	})
});

clearButton.addEventListener("click", ()=>{
	if(confirm("Are you sure you want to clear all tasks and reset?"))
	{
		localStorage.clear();
		location.reload();
	}
})

function submitTask(enterTextArea)
{
	const inputBox = enterTextArea.querySelector(".task-input");
	if(inputBox.value.trim().length>0)
		handleTaskInputted(inputBox);
	inputBox.value = "";
}

function handleTaskInputted(inputBox)
{
	if(inputBox.parentElement.parentElement.querySelector("[data-editing]"))
		editTask(inputBox.parentElement.parentElement.querySelector("[data-editing]"), inputBox);
	else
		createTaskFromInput(inputBox);
}

function editTask(label, inputBox)
{
	label.removeAttribute("data-editing");
	updateTaskLabel(label, inputBox.value.trim());
	taskObject = getCorrespondingObject(label.parentElement.id);
	taskObject.label = inputBox.value.trim();
	saveToStorage();
}

function updateTaskLabel(label, labelValue)
{
	label.innerText = labelValue;
}

function createTaskFromInput(inputBox)
{
	task = createNewTask();
	idCount++;
	localStorage.setItem("idCount", idCount);
	task.id = `task-${idCount}`;
	const label = task.querySelector("label");
	const checkbox = task.querySelector("input");
	label.htmlFor = `input-${idCount}`;
	checkbox.id = `input-${idCount}`;	
	updateTaskLabel(task.querySelector("label"), inputBox.value.trim());
	addTaskToList(task, inputBox.parentElement.parentElement.querySelector(".task-list"), true);
}

function createNewTask()
{
	const task = taskTemplate.content.cloneNode(true).querySelector(".task");
	addTaskDragEventListeners(task);
	const label = task.querySelector("label");
	const checkbox = task.querySelector("input");
	const deleteTaskButton = task.querySelector(".delete-task-button");
	const editTaskButton = task.querySelector(".edit-task-button");
	const pushToTopButton = task.querySelector(".push-to-top-button");
	checkbox.addEventListener("change", updateDone);
	deleteTaskButton.addEventListener("click", deleteTask);
	editTaskButton.addEventListener("click", () => {
		enableEditingTask(label, editTaskButton.parentElement.parentElement.parentElement.querySelector(".task-input"));
	});
	pushToTopButton.addEventListener("click", pushToTop);
	return task;
}

function addTaskDragEventListeners(task)
{
	task.addEventListener("dragstart", () => {
		task.classList.add("dragging");
	});
	task.addEventListener("dragend", () => {
		task.classList.remove("dragging");
	});	
}

function addTaskToList(task, taskList, newTask)
{
	if(newTask)
	{
		taskObjects.push({label: task.querySelector("label").innerText, id: task.id, taskListId: taskList.id, labelId: task.querySelector("label").htmlFor, checkboxId: task.querySelector("input").id,done: task.classList.contains("done")? true : false});
		saveToStorage();
	}
	taskList.append(task);
}

function enableEditingTask(label, inputBox)
{
	inputBox.value = label.innerText;
	inputBox.focus();
	inputBox.parentElement.parentElement.querySelector("[data-editing]")?.removeAttribute("data-editing");
	label.dataset.editing = "true";
}

function pushToTop(e)
{
	const task = e.target.closest(".task");
	const taskList = e.target.closest(".task-list");
	taskList.insertBefore(task, taskList.querySelector(":first-child"));
	const taskObject = getCorrespondingObject(task.id);
	const index = taskObjects.findIndex((taskObject)=>taskObject.id===task.id);
	taskObjects.splice(index, 1);
	taskObjects = [taskObject, ...taskObjects];
	saveToStorage();
}

function updateDone(e)
{
	const task = e.target.parentElement;
	task.classList.toggle("done");
	const taskObject = getCorrespondingObject(task.id);
	taskObject.done = !taskObject.done;
	saveToStorage();
}

function deleteTask(e)
{
	const task = e.target.closest(".task");
	task.remove();
	const index = taskObjects.findIndex((taskObject)=>taskObject.id===task.id);
	taskObjects.splice(index, 1);
	saveToStorage();
}

function getCorrespondingObject(taskId)
{
	return taskObjects.find((taskObject)=>taskObject.id===taskId);
}

function saveToStorage()
{
	localStorage.setItem("taskObjects", JSON.stringify(taskObjects));
}

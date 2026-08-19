const { projectService } = require('../services');

const handleError = (res, error, defaultMessage = 'Server Error') => {
  console.error(error);
  res.status(500).json({ success: false, message: defaultMessage, error: error.message });
};

exports.getProjects = async (req, res) => {
  try {
    const filters = { status: req.query.status };
    const projects = await projectService.getProjects(filters);
    res.json({ success: true, data: projects });
  } catch (error) {
    handleError(res, error, 'Failed to fetch projects');
  }
};

exports.getProjectById = async (req, res) => {
  try {
    const project = await projectService.getProjectById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    res.json({ success: true, data: project });
  } catch (error) {
    handleError(res, error, 'Failed to fetch project');
  }
};

exports.createProject = async (req, res) => {
  try {
    const project = await projectService.createProject(req.body);
    res.status(201).json({ success: true, data: project });
  } catch (error) {
    handleError(res, error, 'Failed to create project');
  }
};

exports.updateProject = async (req, res) => {
  try {
    const project = await projectService.updateProject(req.params.id, req.body);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    res.json({ success: true, data: project });
  } catch (error) {
    handleError(res, error, 'Failed to update project');
  }
};

exports.deleteProject = async (req, res) => {
  try {
    await projectService.deleteProject(req.params.id);
    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    handleError(res, error, 'Failed to delete project');
  }
};

exports.getProjectTasks = async (req, res) => {
  try {
    const tasks = await projectService.getProjectTasks(req.params.id);
    res.json({ success: true, data: tasks });
  } catch (error) {
    handleError(res, error, 'Failed to fetch project tasks');
  }
};

exports.updateProjectContext = async (req, res) => {
  try {
    const project = await projectService.updateProjectContext(req.params.id, req.body);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    res.json({ success: true, data: project });
  } catch (error) {
    handleError(res, error, 'Failed to update project context');
  }
};

exports.getActiveProjects = async (req, res) => {
  try {
    const projects = await projectService.getActiveProjects();
    res.json({ success: true, data: projects });
  } catch (error) {
    handleError(res, error, 'Failed to fetch active projects');
  }
};

exports.getProjectWithContext = async (req, res) => {
  try {
    const project = await projectService.getProjectWithContext(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    res.json({ success: true, data: project });
  } catch (error) {
    handleError(res, error, 'Failed to fetch project with context');
  }
};
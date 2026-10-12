import Employee from '../models/Employee.js';
import { ApiError } from '../utils/errors.js';
import { log } from '../utils/logger.js';
async function requireOwned(eid, user) {
  const owned = await Employee.findOne({ _id: eid, user });
  if (owned) return owned;
  if (await Employee.exists({ _id: eid })) {
    log('authorization_failure', { userId: String(user), employeeId: eid });
    throw new ApiError(403, 'Access to this employee is forbidden');
  }
  throw new ApiError(404, 'Employee not found');
}
export async function list(req, res) { res.json({ employees: await Employee.find({ user: req.user._id }).sort({ created_at: -1 }) }); }
export async function create(req, res) {
  const employee = await Employee.create({ ...req.validated.body, user: req.user._id });
  log('employee_created', { employeeId: String(employee._id), userId: String(req.user._id) });
  res.status(201).json({ employee });
}
export async function get(req, res) { res.json({ employee: await requireOwned(req.validated.params.eid, req.user._id) }); }
export async function update(req, res) {
  const eid = req.validated.params.eid;
  await requireOwned(eid, req.user._id);
  const employee = await Employee.findOneAndUpdate({ _id: eid, user: req.user._id }, req.validated.body, { new: true, runValidators: true });
  if (!employee) throw new ApiError(404, 'Employee not found');
  log('employee_updated', { employeeId: eid }); res.json({ employee });
}
export async function remove(req, res) {
  const eid = req.validated.query.eid;
  await requireOwned(eid, req.user._id);
  const employee = await Employee.findOneAndDelete({ _id: eid, user: req.user._id });
  if (!employee) throw new ApiError(404, 'Employee not found');
  log('employee_deleted', { employeeId: eid }); res.status(204).end();
}

export type StaffMember = { id:number; staff_name:string|null; role:string|null; department:string|null; phone:string|null; email:string|null; is_active:boolean|null; employee_code:string|null; job_title:string|null; hire_date:string|null; employment_status:string|null; salary:number|null; notes:string|null };
export type Attendance = { id:number; staff_id:number; work_date:string; check_in:string|null; check_out:string|null; status:string; notes:string|null; member?:{staff_name:string|null}|null };
export type Shift = { id:number; staff_id:number; weekday:number; start_time:string; end_time:string; is_working:boolean; member?:{staff_name:string|null}|null };
export type HrRole = { id:number; name:string; description:string|null; is_system:boolean; permissions?:Array<{ permission?:{id:number;code:string;name:string;module:string}|null }> };
export type StaffData = { members:StaffMember[]; attendance:Attendance[]; shifts:Shift[]; roles:HrRole[] };

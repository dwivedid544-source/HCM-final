import { useEmployee as useEmployeeContext } from '../context/EmployeeContext';
import { employeeService } from '../services/employee.service';

export const useEmployee = () => {
  const context = useEmployeeContext();
  return {
    ...context,
    service: employeeService,
  };
};

export default useEmployee;

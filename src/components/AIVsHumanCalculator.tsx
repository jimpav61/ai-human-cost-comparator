import React, { useState, useEffect } from 'react';
import { toast } from "@/components/ui/use-toast";

// Voice AI pricing constants
const VOICE_AI_RATES = {
  basic: 0.06, // $ per minute
  standard: 0.12, // $ per minute
  premium: 0.25, // $ per minute
};

// Human labor costs by role (North American averages in 2025)
const HUMAN_HOURLY_RATES = {
  customerService: 21.50, // $ per hour
  sales: 28.75, // $ per hour
  technicalSupport: 32.50, // $ per hour
  generalAdmin: 19.25, // $ per hour
};

const ANIMATION_DELAY = 50; // ms delay between animations

export const AIVsHumanCalculator = () => {
  // States for calculator inputs
  const [role, setRole] = useState('customerService');
  const [aiTier, setAiTier] = useState('standard');
  const [callVolume, setCallVolume] = useState(1000); // calls per month
  const [avgCallDuration, setAvgCallDuration] = useState(5); // minutes
  const [workHoursPerWeek, setWorkHoursPerWeek] = useState(40);
  const [numEmployees, setNumEmployees] = useState(1);
  const [employeeBenefitsCost, setEmployeeBenefitsCost] = useState(30); // percentage on top of salary
  const [employeeUtilization, setEmployeeUtilization] = useState(70); // percentage of time actively handling calls

  // Calculation states
  const [aiCostMonthly, setAiCostMonthly] = useState(0);
  const [humanCostMonthly, setHumanCostMonthly] = useState(0);
  const [monthlySavings, setMonthlySavings] = useState(0);
  const [yearlySavings, setYearlySavings] = useState(0);
  const [savingsPercentage, setSavingsPercentage] = useState(0);
  const [breakEvenCalls, setBreakEvenCalls] = useState(0);
  const [reportGenerated, setReportGenerated] = useState(false);

  // Calculate costs whenever inputs change
  useEffect(() => {
    // Calculate total minutes of calls per month
    const totalMinutesPerMonth = callVolume * avgCallDuration;
    
    // Calculate AI cost
    const aiCost = totalMinutesPerMonth * VOICE_AI_RATES[aiTier];
    setAiCostMonthly(aiCost);
    
    // Calculate human cost
    // First calculate effective hourly rate including benefits
    const effectiveHourlyRate = HUMAN_HOURLY_RATES[role] * (1 + employeeBenefitsCost / 100);
    
    // Calculate monthly hours accounting for utilization
    const hoursPerMonth = (workHoursPerWeek * 52) / 12; // total hours per month
    const effectiveHoursPerMonth = hoursPerMonth * (employeeUtilization / 100); // adjusted for utilization
    
    // Calculate how many employees needed for this call volume
    // (60 minutes in an hour, each call is avgCallDuration minutes)
    const callsHandledPerEmployeePerMonth = (effectiveHoursPerMonth * 60) / avgCallDuration;
    const theoreticalEmployeesNeeded = callVolume / callsHandledPerEmployeePerMonth;
    const actualEmployeesNeeded = Math.max(numEmployees, Math.ceil(theoreticalEmployeesNeeded));
    
    // Total human cost
    const humanCost = effectiveHourlyRate * hoursPerMonth * actualEmployeesNeeded;
    setHumanCostMonthly(humanCost);
    
    // Calculate savings
    const savings = humanCost - aiCost;
    setMonthlySavings(savings);
    setYearlySavings(savings * 12);
    setSavingsPercentage((savings / humanCost) * 100);
    
    // Calculate break-even point (number of calls)
    const employeeCostPerCall = humanCost / callVolume;
    const aiCostPerCall = VOICE_AI_RATES[aiTier] * avgCallDuration;
    if (aiCostPerCall < employeeCostPerCall) {
      setBreakEvenCalls(Math.ceil(
        (effectiveHourlyRate * hoursPerMonth) / 
        (employeeCostPerCall - aiCostPerCall)
      ));
    } else {
      setBreakEvenCalls(0); // AI never breaks even in this scenario
    }
  }, [
    role, aiTier, callVolume, avgCallDuration, workHoursPerWeek, 
    numEmployees, employeeBenefitsCost, employeeUtilization
  ]);

  const handleGenerateReport = () => {
    toast({
      title: "Report Generated",
      description: "Your cost comparison report is ready to download.",
      duration: 3000,
    });
    setReportGenerated(true);
    setTimeout(() => setReportGenerated(false), 3000);
  };

  const handleShareResults = () => {
    toast({
      title: "Share Results",
      description: "Sharing functionality will be implemented in the next version.",
      duration: 3000,
    });
  };

  // Format currency values
  const formatCurrency = (value) => {
    return '$' + value.toFixed(2);
  };

  // Format percentage values
  const formatPercent = (value) => {
    return value.toFixed(1) + '%';
  };

  // Format number with commas
  const formatNumber = (value) => {
    return value.toLocaleString();
  };

  // Role label mapping for display
  const roleLabels = {
    customerService: "Customer Service",
    sales: "Sales",
    technicalSupport: "Technical Support",
    generalAdmin: "General Admin"
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="glass-morphism premium-shadow rounded-3xl overflow-hidden">
        <div className="p-8">
          <h2 className="text-3xl font-semibold text-gray-900 mb-8 animate-fadeIn">
            Voice AI Cost Calculator
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Input Section */}
            <div className="space-y-8 animate-fadeIn" style={{ animationDelay: `${ANIMATION_DELAY}ms` }}>
              <div className="calculator-card">
                <h3 className="text-xl font-medium text-gray-900 mb-6">Configuration</h3>
                
                {/* Job Role Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job Role</label>
                  <select 
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="calculator-input"
                  >
                    <option value="customerService">Customer Service</option>
                    <option value="sales">Sales</option>
                    <option value="technicalSupport">Technical Support</option>
                    <option value="generalAdmin">General Admin</option>
                  </select>
                  <p className="mt-1 text-sm text-gray-500">
                    North American average: {formatCurrency(HUMAN_HOURLY_RATES[role])}/hour
                  </p>
                </div>
                
                {/* AI Tier Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">AI Voice Agent Tier</label>
                  <select 
                    value={aiTier}
                    onChange={(e) => setAiTier(e.target.value)}
                    className="calculator-input"
                  >
                    <option value="basic">Basic ({formatCurrency(VOICE_AI_RATES.basic)}/min)</option>
                    <option value="standard">Standard ({formatCurrency(VOICE_AI_RATES.standard)}/min)</option>
                    <option value="premium">Premium ({formatCurrency(VOICE_AI_RATES.premium)}/min)</option>
                  </select>
                  <p className="mt-1 text-sm text-gray-500">
                    Voice quality and capabilities increase with tier
                  </p>
                </div>
                
                {/* Call Volume */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monthly Call Volume
                  </label>
                  <input 
                    type="number" 
                    min="1"
                    value={callVolume}
                    onChange={(e) => setCallVolume(parseInt(e.target.value) || 0)}
                    className="calculator-input"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Total number of calls per month
                  </p>
                </div>
                
                {/* Call Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Average Call Duration (minutes)
                  </label>
                  <input 
                    type="number" 
                    min="0.5" 
                    step="0.5"
                    value={avgCallDuration}
                    onChange={(e) => setAvgCallDuration(parseFloat(e.target.value) || 0)}
                    className="calculator-input"
                  />
                </div>
                
                {/* Advanced Settings */}
                <div className="pt-4">
                  <h4 className="text-md font-medium text-gray-700 mb-4">Advanced Settings</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Current Employees */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Current Number of Employees
                      </label>
                      <input 
                        type="number" 
                        min="1"
                        value={numEmployees}
                        onChange={(e) => setNumEmployees(parseInt(e.target.value) || 1)}
                        className="calculator-input"
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        Currently handling this type of work
                      </p>
                    </div>
                    
                    {/* Weekly Hours */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Weekly Work Hours
                      </label>
                      <input 
                        type="number" 
                        min="1" 
                        max="168"
                        value={workHoursPerWeek}
                        onChange={(e) => setWorkHoursPerWeek(parseInt(e.target.value) || 0)}
                        className="calculator-input"
                      />
                    </div>
                    
                    {/* Benefits Cost */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Benefits Cost (%)
                      </label>
                      <input 
                        type="number" 
                        min="0" 
                        max="100"
                        value={employeeBenefitsCost}
                        onChange={(e) => setEmployeeBenefitsCost(parseInt(e.target.value) || 0)}
                        className="calculator-input"
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        Additional costs beyond salary
                      </p>
                    </div>
                    
                    {/* Utilization */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Agent Utilization (%)
                      </label>
                      <input 
                        type="number" 
                        min="1" 
                        max="100"
                        value={employeeUtilization}
                        onChange={(e) => setEmployeeUtilization(parseInt(e.target.value) || 0)}
                        className="calculator-input"
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        % of time actively handling calls
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Results Section */}
            <div className="space-y-8 animate-fadeIn" style={{ animationDelay: `${ANIMATION_DELAY * 2}ms` }}>
              <div className="calculator-card">
                <h3 className="text-xl font-medium text-gray-900 mb-6">Cost Analysis</h3>
                
                {/* Monthly Costs */}
                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className="result-card">
                    <div className="text-sm text-gray-500 mb-1">Monthly AI Cost</div>
                    <div className="text-2xl font-bold text-brand-500">{formatCurrency(aiCostMonthly)}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatCurrency(VOICE_AI_RATES[aiTier])}/min × {formatNumber(callVolume)} calls × {avgCallDuration} min
                    </div>
                  </div>
                  
                  <div className="result-card">
                    <div className="text-sm text-gray-500 mb-1">Monthly Human Cost</div>
                    <div className="text-2xl font-bold text-gray-700">{formatCurrency(humanCostMonthly)}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Based on {formatCurrency(HUMAN_HOURLY_RATES[role])}/hr + {employeeBenefitsCost}% benefits
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {numEmployees} employee{numEmployees > 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
                
                {/* Savings Metrics */}
                <div className="result-card mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <div className="text-lg font-medium text-gray-700">Monthly Savings</div>
                    <div className={`text-2xl font-bold ${monthlySavings >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {formatCurrency(Math.abs(monthlySavings))}
                      {monthlySavings < 0 && <span className="text-red-500"> (Loss)</span>}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-sm text-gray-600">Annual Savings</div>
                    <div className={`text-lg font-semibold ${yearlySavings >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {formatCurrency(Math.abs(yearlySavings))}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-600">Cost Reduction</div>
                    <div className={`text-lg font-semibold ${savingsPercentage >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {formatPercent(Math.abs(savingsPercentage))}
                    </div>
                  </div>
                  
                  {/* Savings visualization */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="relative h-6 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`absolute top-0 left-0 h-full ${savingsPercentage >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                        style={{ width: `${Math.min(Math.abs(savingsPercentage), 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-gray-500">
                      <div>0%</div>
                      <div>50%</div>
                      <div>100%</div>
                    </div>
                  </div>
                </div>
                
                {/* Break-even Analysis */}
                <div className="result-card mb-8">
                  <div className="text-sm text-gray-500 mb-1">Break-even Point</div>
                  {breakEvenCalls > 0 ? (
                    <>
                      <div className="text-xl font-bold text-gray-700">{formatNumber(breakEvenCalls)} calls/month</div>
                      <div className="text-xs text-gray-500 mt-1">
                        AI becomes more cost-effective after this volume
                      </div>
                    </>
                  ) : (
                    <div className="text-md font-medium text-gray-700">
                      {aiCostMonthly > humanCostMonthly 
                        ? "Human agents are more cost-effective at all volumes" 
                        : "AI is more cost-effective at all volumes"}
                    </div>
                  )}
                </div>
                
                {/* Actions */}
                <div className="flex space-x-4">
                  <button 
                    onClick={handleGenerateReport}
                    disabled={reportGenerated}
                    className="flex-1 bg-brand-500 hover:bg-brand-600 text-white py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50"
                  >
                    {reportGenerated ? 'Report Generated!' : 'Generate Report'}
                  </button>
                  
                  <button 
                    onClick={handleShareResults}
                    className="flex-1 border-2 border-brand-500 text-brand-500 hover:bg-brand-50 py-3 px-6 rounded-lg transition-all duration-200"
                  >
                    Share Results
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

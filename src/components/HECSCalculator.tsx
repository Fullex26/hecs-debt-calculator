import { useForm } from '@mantine/form';
import { 
  Button, Paper, Title, Stack, NumberInput, Box, Text, Grid, 
  Tooltip, ThemeIcon, Divider, Timeline, LoadingOverlay,
  Card, Group, Container, ActionIcon, Collapse, Transition, Table
} from '@mantine/core';
import { useMediaQuery, useViewportSize } from '@mantine/hooks';
import { useState } from 'react';
import { 
  IconInfoCircle, IconCalculator, IconPercentage,
  IconChevronDown, IconChevronUp, IconCurrencyDollar
} from '@tabler/icons-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import './HECSCalculator.css';

interface CalculationResult {
  repaymentRate: number;
  annualRepayment: number;
  weeklyRepayment: number;
  yearsToRepay: number;
  totalWithIndexation: number;
  yearlyData: YearlyData[];
  projectionMilestones: ProjectionMilestone[];
  totalInterestPaid: number;
  totalRepayments: number;
}

interface YearlyData {
  year: number;
  remainingDebt: number;
  annualRepayment: number;
  income: number;
}

interface ProjectionMilestone {
  year: number;
  description: string;
  type: 'milestone' | 'warning' | 'success';
  value: number;
}

const INDEXATION_RATE = 4.0; // Current indexation rate for 2024

interface TooltipProps {
  active?: boolean;
  payload?: {
    value: number;
    name: string;
    color: string;
  }[];
  label?: string;
}

const formatCurrency = (value: number) => 
  value.toLocaleString('en-AU', { 
    style: 'currency', 
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

// Add custom tooltip component for better UX
const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <Card p="xs" withBorder shadow="sm" style={{ background: 'var(--mantine-color-body)' }}>
        <Text fw={600} mb={5}>Year {label}</Text>
        {payload.map((entry, index) => (
          <Group key={index} gap="xs">
            <Box w={12} h={12} style={{ 
              backgroundColor: entry.color,
              borderRadius: '50%'
            }} />
            <Text size="sm" c="dimmed">{entry.name}:</Text>
            <Text size="sm" fw={500}>{formatCurrency(entry.value)}</Text>
          </Group>
        ))}
      </Card>
    );
  }
  return null;
};

const REPAYMENT_THRESHOLDS = [
  { min: 0, max: 54434, rate: 0 },
  { min: 54435, max: 62850, rate: 1.0 },
  { min: 62851, max: 66620, rate: 2.0 },
  { min: 66621, max: 70618, rate: 2.5 },
  { min: 70619, max: 74855, rate: 3.0 },
  { min: 74856, max: 79346, rate: 3.5 },
  { min: 79347, max: 84107, rate: 4.0 },
  { min: 84108, max: 89154, rate: 4.5 },
  { min: 89155, max: 94503, rate: 5.0 },
  { min: 94504, max: 100174, rate: 5.5 },
  { min: 100175, max: 106185, rate: 6.0 },
  { min: 106186, max: 112556, rate: 6.5 },
  { min: 112557, max: 119309, rate: 7.0 },
  { min: 119310, max: 126467, rate: 7.5 },
  { min: 126468, max: 134056, rate: 8.0 },
  { min: 134057, max: 142100, rate: 8.5 },
  { min: 142101, max: 150626, rate: 9.0 },
  { min: 150627, max: 159663, rate: 9.5 },
  { min: 159664, max: Infinity, rate: 10.0 }
];

const RepaymentThresholdTooltip = () => (
  <Box p="xs">
    <Text fw={500} mb="xs">2024-25 Repayment Thresholds</Text>
    <Table miw={300} layout="fixed">
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Income Range</Table.Th>
          <Table.Th>Rate</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {REPAYMENT_THRESHOLDS.map((threshold, index) => (
          <Table.Tr key={index}>
            <Table.Td>
              {threshold.max === Infinity 
                ? `$${formatCurrency(threshold.min)} and above`
                : `$${formatCurrency(threshold.min)} - $${formatCurrency(threshold.max)}`
              }
            </Table.Td>
            <Table.Td>{threshold.rate}%</Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  </Box>
);

interface FormValues {
  currentDebt: string;
  annualIncome: string;
  expectedSalaryIncrease: number;
  voluntaryPaymentYear: number | '';
  voluntaryPaymentAmount: string;
}

export function HECSCalculator() {
  const isMobile = useMediaQuery('(max-width: 480px)');
  const { height } = useViewportSize();
  const [isCalculating, setIsCalculating] = useState(false);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showVoluntary, setShowVoluntary] = useState(false);
  const [chartAnimated, setChartAnimated] = useState(false);

  const form = useForm<FormValues>({
    initialValues: {
      currentDebt: '',
      annualIncome: '',
      expectedSalaryIncrease: 3,
      voluntaryPaymentYear: '',
      voluntaryPaymentAmount: '',
    },
    validate: {
      currentDebt: (value) => {
        const numValue = Number(value);
        if (value && (isNaN(numValue) || numValue < 0)) return 'Debt cannot be negative';
        if (numValue > 500000) return 'Please enter a value less than $500,000';
        return null;
      },
      annualIncome: (value) => {
        const numValue = Number(value);
        if (value && (isNaN(numValue) || numValue < 0)) return 'Income cannot be negative';
        if (numValue > 1000000) return 'Please enter a value less than $1,000,000';
        return null;
      },
      expectedSalaryIncrease: (value) => {
        if (value < 0) return 'Percentage cannot be negative';
        if (value > 25) return 'Please enter a percentage less than 25';
        return null;
      },
      voluntaryPaymentAmount: (value, values) => {
        if (!value && values.voluntaryPaymentYear) return 'Please enter a voluntary payment amount';
        if (!value) return null;
        const numValue = Number(value);
        const currentDebtValue = Number(values.currentDebt) || 0;
        if (numValue > currentDebtValue) return 'Voluntary payment cannot exceed your current HECS debt';
        if (!values.voluntaryPaymentYear) return 'Please also specify the year for the voluntary payment';
        return null;
      },
      voluntaryPaymentYear: (value, values) => {
        if (!value && values.voluntaryPaymentAmount) return 'Please enter the year for your voluntary payment';
        if (!value) return null;
        if (value < 0) return 'Year cannot be negative';
        if (value > 50) return 'Please enter a year less than 50';
        if (!values.voluntaryPaymentAmount) return 'Please also specify the voluntary payment amount';
        return null;
      },
    },
  });

  const calculateRepaymentRate = (income: number): number => {
    if (income < 54435) return 0;
    if (income < 62851) return 1.0;
    if (income < 66621) return 2.0;
    if (income < 70619) return 2.5;
    if (income < 74856) return 3.0;
    if (income < 79347) return 3.5;
    if (income < 84108) return 4.0;
    if (income < 89155) return 4.5;
    if (income < 94504) return 5.0;
    if (income < 100175) return 5.5;
    if (income < 106186) return 6.0;
    if (income < 112557) return 6.5;
    if (income < 119310) return 7.0;
    if (income < 126468) return 7.5;
    if (income < 134057) return 8.0;
    if (income < 142101) return 8.5;
    if (income < 150627) return 9.0;
    if (income < 159664) return 9.5;
    return 10.0;
  };

  const calculateRepayment = (income: number): CalculationResult => {
    const yearlyData: YearlyData[] = [];
    const projectionMilestones: ProjectionMilestone[] = [];
    
    // Convert all initial values to numbers
    const currentDebtValue = Number(form.values.currentDebt) || 0;
    const salaryIncrease = Number(form.values.expectedSalaryIncrease);
    const indexationRate = Number(INDEXATION_RATE);
    const voluntaryPaymentYear = Number(form.values.voluntaryPaymentYear) || -1;
    const voluntaryPaymentAmount = Number(form.values.voluntaryPaymentAmount) || 0;
    
    // Initialize calculation variables
    let remainingDebt = currentDebtValue;
    let currentIncome = income;
    let years = 0;
    let totalInterestPaid = 0;
    let totalRepayments = 0;
    let quarterPaidYear = 0;
    let halfPaidYear = 0;
    let threeQuartersPaidYear = 0;
    const initialDebt = currentDebtValue;
    const initialRepaymentRate = calculateRepaymentRate(income);
    const initialAnnualRepayment = (income * initialRepaymentRate) / 100;

    // Add initial milestone
    projectionMilestones.push({
      year: 0,
      description: 'Starting HECS-HELP debt',
      type: 'milestone',
      value: initialDebt,
    });

    while (remainingDebt > 0 && years < 50) {
      // Calculate yearly values
      const repaymentRate = calculateRepaymentRate(currentIncome);
      const yearlyRepayment = (currentIncome * repaymentRate) / 100;
      const yearlyIndexation = (remainingDebt * indexationRate) / 100;
      
      // Apply voluntary payment if it's the specified year
      let totalYearlyRepayment = yearlyRepayment;
      if (years === voluntaryPaymentYear) {
        totalYearlyRepayment += voluntaryPaymentAmount;
        projectionMilestones.push({
          year: years + 1,
          description: `Voluntary payment of ${formatCurrency(voluntaryPaymentAmount)} made`,
          type: 'success',
          value: remainingDebt - totalYearlyRepayment,
        });
      }
      
      // Update totals
      totalInterestPaid += yearlyIndexation;
      totalRepayments += totalYearlyRepayment;

      // Update remaining debt and ensure it doesn't go below 0
      remainingDebt = Math.max(0, remainingDebt + yearlyIndexation - totalYearlyRepayment);

      // Store yearly data
      yearlyData.push({
        year: years + 1,
        remainingDebt,
        annualRepayment: totalYearlyRepayment,
        income: currentIncome,
      });

      // Update values for next year
      currentIncome = currentIncome + (currentIncome * salaryIncrease) / 100;
      years++;

      // Check for milestones
      if (!quarterPaidYear && remainingDebt <= initialDebt * 0.75) {
        quarterPaidYear = years;
        projectionMilestones.push({
          year: years,
          description: '25% of debt repaid',
          type: 'milestone',
          value: remainingDebt,
        });
      }
      if (!halfPaidYear && remainingDebt <= initialDebt * 0.5) {
        halfPaidYear = years;
        projectionMilestones.push({
          year: years,
          description: '50% of debt repaid',
          type: 'milestone',
          value: remainingDebt,
        });
      }
      if (!threeQuartersPaidYear && remainingDebt <= initialDebt * 0.25) {
        threeQuartersPaidYear = years;
        projectionMilestones.push({
          year: years,
          description: '75% of debt repaid',
          type: 'milestone',
          value: remainingDebt,
        });
      }
    }

    // Add completion milestone
    if (years < 50) {
      projectionMilestones.push({
        year: years,
        description: 'Debt fully repaid! 🎉',
        type: 'success',
        value: 0,
      });
    } else {
      projectionMilestones.push({
        year: 50,
        description: 'Projection limit reached - debt not fully repaid',
        type: 'warning',
        value: remainingDebt,
      });
    }

    const totalWithIndexation = (Number(form.values.currentDebt) || 0) * (1 + INDEXATION_RATE / 100);

    return {
      repaymentRate: initialRepaymentRate,
      annualRepayment: initialAnnualRepayment,
      weeklyRepayment: initialAnnualRepayment / 52,
      yearsToRepay: years,
      totalWithIndexation,
      yearlyData,
      projectionMilestones,
      totalInterestPaid,
      totalRepayments,
    };
  };

  return (
    <Box pos="relative" mih={height}>
      <LoadingOverlay 
        visible={isCalculating} 
        zIndex={1000} 
        overlayProps={{ blur: 2 }}
        loaderProps={{ size: 'xl', color: 'blue' }}
      />
      <Paper radius={0} style={{ minHeight: '100vh' }}>
        <Container size="xl">
          <Stack gap="md">
            {/* Header Section */}
            <Box ta="center" pt="md">
              <ThemeIcon size={isMobile ? 60 : 80} radius={80} mb="md">
                <IconCalculator size={isMobile ? 30 : 40} stroke={1.5} />
              </ThemeIcon>
              <Title order={1} size={isMobile ? 'h2' : 'h1'}>HECS Debt Calculator</Title>
              <Text c="dimmed" size={isMobile ? 'md' : 'lg'} mt="xs" maw={600} mx="auto">
              Plan your future with confidence using our comprehensive HECS-HELP loan calculator. Easily estimate your repayments, see important milestones, and gain a clear understanding of your student debt journey. Please note, all results are estimates and should not be considered financial advice.
              </Text>
            </Box>

            <Divider />

            {/* Form Section */}
            <form onSubmit={form.onSubmit((values) => {
              if (!values.currentDebt || !values.annualIncome) {
                return;
              }
              setIsCalculating(true);
              setTimeout(() => {
                const result = calculateRepayment(Number(values.annualIncome));
                setResult(result);
                setIsCalculating(false);
                setChartAnimated(true);
              }, 200);
            })}>
              <Grid gutter="md">
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Card>
                    <Stack gap="md">
                      <NumberInput
                        label={
                          <Group gap="xs">
                            <Text fw={500} size={isMobile ? 'md' : 'lg'}>Current HECS Debt</Text>
                            <Tooltip 
                              label="Your current or expected HECS-HELP loan balance"
                              position={isMobile ? "bottom" : "right"}
                              multiline
                              maw={300}
                              withArrow
                            >
                              <IconInfoCircle size={18} style={{ cursor: 'help' }} />
                            </Tooltip>
                          </Group>
                        }
                        placeholder="Enter your current HECS debt"
                        size={isMobile ? 'md' : 'lg'}
                        {...form.getInputProps('currentDebt')}
                        min={0}
                        max={500000}
                        leftSection={<IconCurrencyDollar size={18} />}
                        hideControls
                        clampBehavior="strict"
                        required
                      />

                      <Box>
                        <Group justify="space-between" mb="xs">
                          <Text size={isMobile ? 'md' : 'lg'} fw={500}>Voluntary Repayment Options</Text>
                          <ActionIcon 
                            variant="subtle" 
                            onClick={() => setShowVoluntary(!showVoluntary)}
                            size={isMobile ? 'md' : 'lg'}
                            aria-label={showVoluntary ? 'Hide voluntary repayment options' : 'Show voluntary repayment options'}
                          >
                            {showVoluntary ? <IconChevronUp size={20} /> : <IconChevronDown size={20} />}
                          </ActionIcon>
                        </Group>
                        
                        <Collapse in={showVoluntary} transitionDuration={200}>
                          <Stack gap="sm" pl="md">
                            <NumberInput
                              label={
                                <Group gap="xs">
                                  <Text fw={500} size={isMobile ? 'sm' : 'md'}>Voluntary Payment Year</Text>
                                  <Tooltip 
                                    label="Which year would you like to make the voluntary payment?"
                                    position={isMobile ? "bottom" : "right"}
                                    multiline
                                    maw={300}
                                    withArrow
                                  >
                                    <IconInfoCircle size={16} style={{ cursor: 'help' }} />
                                  </Tooltip>
                                </Group>
                              }
                              placeholder="Enter year (e.g. 2)"
                              size={isMobile ? 'sm' : 'md'}
                              min={1}
                              max={50}
                              hideControls
                              clampBehavior="strict"
                              {...form.getInputProps('voluntaryPaymentYear')}
                            />
                            <NumberInput
                              label={
                                <Group gap="xs">
                                  <Text fw={500} size={isMobile ? 'sm' : 'md'}>Voluntary Payment Amount</Text>
                                  <Tooltip 
                                    label="How much would you like to pay voluntarily?"
                                    position={isMobile ? "bottom" : "right"}
                                    multiline
                                    maw={300}
                                    withArrow
                                  >
                                    <IconInfoCircle size={16} style={{ cursor: 'help' }} />
                                  </Tooltip>
                                </Group>
                              }
                              placeholder="Enter amount (e.g. 5000)"
                              size={isMobile ? 'sm' : 'md'}
                              min={0}
                              max={1000000}
                              leftSection={<IconCurrencyDollar size={16} />}
                              hideControls
                              clampBehavior="strict"
                              {...form.getInputProps('voluntaryPaymentAmount')}
                            />
                          </Stack>
                        </Collapse>
                      </Box>
                    </Stack>
                  </Card>
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Card>
                    <Stack gap="md">
                      <NumberInput
                        label={
                          <Group gap="xs">
                            <Text fw={500} size={isMobile ? 'md' : 'lg'}>Annual Income</Text>
                            <Tooltip 
                              label="Your current or expected annual income before tax deductions"
                              position={isMobile ? "bottom" : "right"}
                              multiline
                              maw={300}
                              withArrow
                            >
                              <IconInfoCircle size={18} style={{ cursor: 'help' }} />
                            </Tooltip>
                          </Group>
                        }
                        placeholder="Enter your annual income"
                        size={isMobile ? 'md' : 'lg'}
                        {...form.getInputProps('annualIncome')}
                        min={0}
                        max={1000000}
                        leftSection={<IconCurrencyDollar size={18} />}
                        hideControls
                        clampBehavior="strict"
                        required
                      />

                      <Box>
                        <Group justify="space-between" mb="xs">
                          <Text size={isMobile ? 'md' : 'lg'} fw={500}>Advanced Options</Text>
                          <ActionIcon 
                            variant="subtle" 
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            size={isMobile ? 'md' : 'lg'}
                            aria-label={showAdvanced ? 'Hide advanced options' : 'Show advanced options'}
                          >
                            {showAdvanced ? <IconChevronUp size={20} /> : <IconChevronDown size={20} />}
                          </ActionIcon>
                        </Group>
                        
                        <Collapse in={showAdvanced} transitionDuration={200}>
                          <Stack gap="sm" pl="md">
                            <NumberInput
                              label={
                                <Group gap="xs">
                                  <Text fw={500} size={isMobile ? 'sm' : 'md'}>Expected Annual Salary Increase (%)</Text>
                                  <Tooltip 
                                    label="Estimated yearly percentage increase in your salary"
                                    position={isMobile ? "bottom" : "right"}
                                    multiline
                                    maw={300}
                                    withArrow
                                  >
                                    <IconInfoCircle size={16} style={{ cursor: 'help' }} />
                                  </Tooltip>
                                </Group>
                              }
                              placeholder="Enter expected salary increase"
                              size={isMobile ? 'sm' : 'md'}
                              min={0}
                              max={100}
                              step={0.5}
                              hideControls
                              clampBehavior="strict"
                              {...form.getInputProps('expectedSalaryIncrease')}
                              rightSection={<IconPercentage size={16} />}
                            />
                          </Stack>
                        </Collapse>
                      </Box>
                    </Stack>
                  </Card>
                </Grid.Col>
              </Grid>

              <Group justify="center" mt="lg">
                <Button 
                  type="submit"
                  size={isMobile ? 'lg' : 'xl'}
                  rightSection={<IconCalculator size={20} stroke={1.5} />}
                  fullWidth={isMobile}
                  loading={isCalculating}
                >
                  Calculate Repayments
                </Button>
              </Group>
            </form>

            {/* Results Section */}
            <Transition mounted={!!result} transition="slide-up" duration={400}>
              {(styles) => (
                <div style={styles}>
                  <Stack gap="md">
                    <Divider 
                      label={<Title order={2} size={isMobile ? 'h3' : 'h2'}>Results</Title>} 
                      labelPosition="center" 
                      size="sm" 
                    />
                    
                    {result && (
                      <Grid gutter="md">
                        <Grid.Col span={{ base: 12, md: 6 }}>
                          <Card>
                            <Stack gap="md">
                              <Title order={2} size={isMobile ? 'h3' : 'h2'}>Key Figures</Title>
                              <Grid>
                                <Grid.Col span={{ base: 12, sm: 6 }}>
                                  <Text size={isMobile ? 'md' : 'lg'} c="dimmed">Repayment Rate</Text>
                                  <Text fw={700} size={isMobile ? 'lg' : 'xl'}>{result.repaymentRate}%</Text>
                                </Grid.Col>
                                <Grid.Col span={{ base: 12, sm: 6 }}>
                                  <Text size={isMobile ? 'md' : 'lg'} c="dimmed">Years to Repay</Text>
                                  <Text fw={700} size={isMobile ? 'lg' : 'xl'}>{result.yearsToRepay}</Text>
                                </Grid.Col>
                                <Grid.Col span={{ base: 12, sm: 6 }}>
                                  <Text size={isMobile ? 'md' : 'lg'} c="dimmed">Annual Repayment</Text>
                                  <Text fw={700} size={isMobile ? 'lg' : 'xl'}>{formatCurrency(result.annualRepayment)}</Text>
                                </Grid.Col>
                                <Grid.Col span={{ base: 12, sm: 6 }}>
                                  <Text size={isMobile ? 'md' : 'lg'} c="dimmed">Weekly Repayment</Text>
                                  <Text fw={700} size={isMobile ? 'lg' : 'xl'}>{formatCurrency(result.weeklyRepayment)}</Text>
                                </Grid.Col>
                              </Grid>
                            </Stack>
                          </Card>
                        </Grid.Col>

                        <Grid.Col span={{ base: 12, md: 6 }}>
                          <Card>
                            <Stack gap="md">
                              <Title order={2} size={isMobile ? 'h3' : 'h2'}>Total Costs</Title>
                              <Grid>
                                <Grid.Col span={{ base: 12, sm: 6 }}>
                                  <Text size={isMobile ? 'md' : 'lg'} c="dimmed">Total Interest</Text>
                                  <Text fw={700} size={isMobile ? 'lg' : 'xl'}>{formatCurrency(result.totalInterestPaid)}</Text>
                                </Grid.Col>
                                <Grid.Col span={{ base: 12, sm: 6 }}>
                                  <Text size={isMobile ? 'md' : 'lg'} c="dimmed">Total Repayments</Text>
                                  <Text fw={700} size={isMobile ? 'lg' : 'xl'}>{formatCurrency(result.totalRepayments)}</Text>
                                </Grid.Col>
                                <Grid.Col span={12}>
                                  <Text size={isMobile ? 'md' : 'lg'} c="dimmed">Next Year's Balance (with Indexation)</Text>
                                  <Text fw={700} size={isMobile ? 'lg' : 'xl'}>{formatCurrency(result.totalWithIndexation)}</Text>
                                </Grid.Col>
                              </Grid>
                            </Stack>
                          </Card>
                        </Grid.Col>
                      </Grid>
                    )}

                    {/* Chart Section */}
                    {result && (
                      <Card>
                        <Stack gap="md">
                          <Group justify="space-between" align="center">
                            <Title order={2} size={isMobile ? 'h3' : 'h2'}>Repayment Projection</Title>
                            <Tooltip 
                              label="The chart shows your projected HECS debt balance and annual repayments over time"
                              position={isMobile ? "bottom" : "right"}
                              multiline
                              maw={300}
                              withArrow
                            >
                              <ActionIcon variant="subtle" radius="xl" size={isMobile ? 'md' : 'lg'}>
                                <IconInfoCircle className="help-cursor" />
                              </ActionIcon>
                            </Tooltip>
                          </Group>
                          
                          <Text size="sm" c="dimmed">
                            Track how your HECS debt decreases over time as you make repayments, accounting for indexation and salary increases.
                          </Text>

                          <Box className="chart-container">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart
                                data={result.yearlyData}
                                margin={{ 
                                  top: 20, 
                                  right: 30, 
                                  left: isMobile ? 20 : 40, 
                                  bottom: 20 
                                }}
                              >
                                <CartesianGrid 
                                  strokeDasharray="3 3" 
                                  stroke="var(--mantine-color-gray-3)" 
                                  vertical={!isMobile}
                                />
                                <XAxis 
                                  dataKey="year" 
                                  label={{ 
                                    value: 'Years from Now', 
                                    position: 'insideBottom', 
                                    offset: -10,
                                    fontSize: isMobile ? 12 : 14,
                                    fill: 'var(--mantine-color-gray-7)'
                                  }} 
                                  tick={{ 
                                    fontSize: isMobile ? 12 : 14, 
                                    fill: 'var(--mantine-color-gray-7)',
                                    dy: 8
                                  }}
                                  axisLine={{ stroke: 'var(--mantine-color-gray-4)' }}
                                  tickLine={{ stroke: 'var(--mantine-color-gray-4)' }}
                                  padding={{ left: 20, right: 20 }}
                                />
                                <YAxis 
                                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                                  label={{ 
                                    value: 'Amount', 
                                    angle: -90, 
                                    position: 'insideLeft',
                                    offset: isMobile ? -10 : -15,
                                    fontSize: isMobile ? 12 : 14,
                                    fill: 'var(--mantine-color-gray-7)'
                                  }}
                                  tick={{ 
                                    fontSize: isMobile ? 12 : 14, 
                                    fill: 'var(--mantine-color-gray-7)',
                                    dx: -8
                                  }}
                                  axisLine={{ stroke: 'var(--mantine-color-gray-4)' }}
                                  tickLine={{ stroke: 'var(--mantine-color-gray-4)' }}
                                  padding={{ top: 20, bottom: 20 }}
                                />
                                <RechartsTooltip 
                                  content={<CustomTooltip />}
                                  cursor={{ 
                                    stroke: 'var(--mantine-color-gray-4)',
                                    strokeWidth: 1,
                                    strokeDasharray: '5 5'
                                  }}
                                />
                                <Legend 
                                  verticalAlign="top"
                                  height={36}
                                  iconType="circle"
                                  iconSize={10}
                                  formatter={(value) => (
                                    <Text span size="sm" c="dimmed">
                                      {value}
                                    </Text>
                                  )}
                                  wrapperStyle={{
                                    paddingTop: '10px',
                                  }}
                                />
                                <Line 
                                  type="monotone" 
                                  dataKey="remainingDebt" 
                                  name="Remaining Debt"
                                  stroke="var(--mantine-color-blue-6)" 
                                  fill="var(--mantine-color-blue-1)"
                                  strokeWidth={3}
                                  dot={false}
                                  activeDot={{ 
                                    r: 6, 
                                    stroke: 'var(--mantine-color-blue-7)',
                                    strokeWidth: 2,
                                    fill: 'var(--mantine-color-blue-2)'
                                  }}
                                  isAnimationActive={chartAnimated}
                                  animationDuration={1500}
                                  animationEasing="ease-out"
                                />
                                <Line 
                                  type="monotone" 
                                  dataKey="annualRepayment" 
                                  name="Annual Repayment"
                                  stroke="var(--mantine-color-green-6)" 
                                  fill="var(--mantine-color-green-1)"
                                  strokeWidth={3}
                                  dot={false}
                                  activeDot={{ 
                                    r: 6, 
                                    stroke: 'var(--mantine-color-green-7)',
                                    strokeWidth: 2,
                                    fill: 'var(--mantine-color-green-2)'
                                  }}
                                  isAnimationActive={chartAnimated}
                                  animationDuration={1500}
                                  animationEasing="ease-out"
                                  animationBegin={300}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </Box>

                          <Group gap="lg" mt="xs">
                            <Group gap="xs">
                              <Box w={12} h={12} className="circle legend-dot-blue" />
                              <Text size="sm">Remaining Debt: Your outstanding HECS balance over time</Text>
                            </Group>
                            <Group gap="xs">
                              <Box w={12} h={12} className="circle legend-dot-green" />
                              <Text size="sm">Annual Repayment: Your yearly HECS repayment amount</Text>
                            </Group>
                          </Group>
                        </Stack>
                      </Card>
                    )}

                    {/* Milestones Section */}
                    {result && (
                      <Card>
                        <Title order={2} size={isMobile ? 'h3' : 'h2'} mb="md">Repayment Milestones</Title>
                        <Timeline 
                          active={result.projectionMilestones.length - 1} 
                          bulletSize={isMobile ? 24 : 32} 
                          lineWidth={2}
                        >
                          {result.projectionMilestones.map((milestone, index) => (
                            <Timeline.Item
                              key={index}
                              title={
                                <Text size={isMobile ? 'md' : 'lg'} fw={500}>
                                  {milestone.description}
                                </Text>
                              }
                              color={
                                milestone.type === 'success' 
                                  ? 'green' 
                                  : milestone.type === 'warning' 
                                    ? 'yellow' 
                                    : 'blue'
                              }
                            >
                              <Text size={isMobile ? 'sm' : 'md'}>Year {milestone.year}</Text>
                              <Text size={isMobile ? 'md' : 'lg'} fw={500}>
                                {formatCurrency(milestone.value)}
                              </Text>
                            </Timeline.Item>
                          ))}
                        </Timeline>
                      </Card>
                    )}
                  </Stack>
                </div>
              )}
            </Transition>
          </Stack>
        </Container>
      </Paper>
    </Box>
  );
} 
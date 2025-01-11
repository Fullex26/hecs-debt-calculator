import { useForm } from '@mantine/form';
import { 
  Button, Paper, Title, Stack, NumberInput, Box, Text, Grid, 
  Tooltip, ThemeIcon, Divider, Timeline, LoadingOverlay,
  Card, Group, Container, ActionIcon, Collapse, Transition
} from '@mantine/core';
import { useMediaQuery, useViewportSize } from '@mantine/hooks';
import { useState } from 'react';
import { 
  IconInfoCircle, IconCalculator, IconPercentage,
  IconChevronDown, IconChevronUp, IconCurrencyDollar
} from '@tabler/icons-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

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

const INDEXATION_RATE = 7.1; // Current indexation rate for 2023

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

export function HECSCalculator() {
  const isMobile = useMediaQuery('(max-width: 480px)');
  const { height } = useViewportSize();
  const [isCalculating, setIsCalculating] = useState(false);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  // Add chart animation control
  const [chartAnimated, setChartAnimated] = useState(false);

  const form = useForm({
    initialValues: {
      currentDebt: 0,
      annualIncome: 0,
      expectedSalaryIncrease: 3,
    },
    validate: {
      currentDebt: (value) => {
        if (value < 0) return 'Debt cannot be negative';
        if (value > 1000000) return 'Please enter a value less than $1,000,000';
        return null;
      },
      annualIncome: (value) => {
        if (value < 0) return 'Income cannot be negative';
        if (value > 1000000) return 'Please enter a value less than $1,000,000';
        return null;
      },
      expectedSalaryIncrease: (value) => {
        if (value < 0) return 'Percentage cannot be negative';
        if (value > 100) return 'Please enter a percentage less than 100';
        return null;
      },
    },
  });

  const calculateRepaymentRate = (income: number): number => {
    if (income < 51550) return 0;
    if (income < 57154) return 1.0;
    if (income < 62764) return 2.0;
    if (income < 66354) return 2.5;
    if (income < 69999) return 3.0;
    if (income < 73999) return 3.5;
    if (income < 77999) return 4.0;
    if (income < 82999) return 4.5;
    if (income < 87999) return 5.0;
    if (income < 92999) return 5.5;
    if (income < 97999) return 6.0;
    if (income < 102999) return 6.5;
    if (income < 107999) return 7.0;
    return 10.0;
  };

  const calculateRepayment = (income: number): CalculationResult => {
    const yearlyData: YearlyData[] = [];
    const projectionMilestones: ProjectionMilestone[] = [];
    let remainingDebt = form.values.currentDebt;
    let currentIncome = income;
    let years = 0;
    let totalInterestPaid = 0;
    let totalRepayments = 0;
    let quarterPaidYear = 0;
    let halfPaidYear = 0;
    let threeQuartersPaidYear = 0;
    const initialDebt = form.values.currentDebt;
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
      const yearlyRepayment = (currentIncome * calculateRepaymentRate(currentIncome)) / 100;
      const yearlyIndexation = remainingDebt * (INDEXATION_RATE / 100);
      
      totalInterestPaid += yearlyIndexation;
      totalRepayments += yearlyRepayment;

      // Check for milestones
      if (!quarterPaidYear && remainingDebt <= initialDebt * 0.75) {
        quarterPaidYear = years + 1;
        projectionMilestones.push({
          year: years + 1,
          description: '25% of debt repaid',
          type: 'milestone',
          value: remainingDebt,
        });
      }
      if (!halfPaidYear && remainingDebt <= initialDebt * 0.5) {
        halfPaidYear = years + 1;
        projectionMilestones.push({
          year: years + 1,
          description: '50% of debt repaid',
          type: 'milestone',
          value: remainingDebt,
        });
      }
      if (!threeQuartersPaidYear && remainingDebt <= initialDebt * 0.25) {
        threeQuartersPaidYear = years + 1;
        projectionMilestones.push({
          year: years + 1,
          description: '75% of debt repaid',
          type: 'milestone',
          value: remainingDebt,
        });
      }

      yearlyData.push({
        year: years + 1,
        remainingDebt: Math.max(0, remainingDebt),
        annualRepayment: yearlyRepayment,
        income: currentIncome,
      });

      // Apply indexation
      remainingDebt *= (1 + INDEXATION_RATE / 100);
      // Apply salary increase
      currentIncome *= (1 + form.values.expectedSalaryIncrease / 100);
      // Subtract repayment
      remainingDebt -= yearlyRepayment;
      years++;
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

    const totalWithIndexation = form.values.currentDebt * (1 + INDEXATION_RATE / 100);

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

  const handleSubmit = form.onSubmit(async (values) => {
    setIsCalculating(true);
    setChartAnimated(false);
    try {
      await new Promise(resolve => setTimeout(resolve, 600));
      const calculationResult = calculateRepayment(values.annualIncome);
      setResult(calculationResult);
      // Trigger chart animation after a small delay
      setTimeout(() => setChartAnimated(true), 100);
    } finally {
      setIsCalculating(false);
    }
  });

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
            <Box style={{ textAlign: 'center' }} pt="md">
              <ThemeIcon size={isMobile ? 60 : 80} radius={80} mb="md">
                <IconCalculator size={isMobile ? 30 : 40} stroke={1.5} />
              </ThemeIcon>
              <Title order={1} size={isMobile ? 'h2' : 'h1'}>HECS Debt Calculator</Title>
              <Text c="dimmed" size={isMobile ? 'md' : 'lg'} mt="xs" maw={600} mx="auto">
                Plan your future with our comprehensive HECS-HELP loan calculator. Calculate your repayments, track milestones, and understand your debt journey.
              </Text>
            </Box>

            <Divider />

            {/* Form Section */}
            <form onSubmit={handleSubmit}>
              <Grid gutter="md">
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Card>
                    <NumberInput
                      label={
                        <Group gap="xs">
                          <Text fw={500} size={isMobile ? 'md' : 'lg'}>Current HECS Debt</Text>
                          <Tooltip label="Your current HECS-HELP loan balance">
                            <IconInfoCircle size={18} style={{ cursor: 'help' }} />
                          </Tooltip>
                        </Group>
                      }
                      placeholder="Enter your current HECS debt"
                      size={isMobile ? 'md' : 'lg'}
                      {...form.getInputProps('currentDebt')}
                      min={0}
                      max={1000000}
                      leftSection={<IconCurrencyDollar size={18} />}
                      hideControls
                      clampBehavior="strict"
                    />
                  </Card>
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Card>
                    <Stack gap="md">
                      <NumberInput
                        label={
                          <Group gap="xs">
                            <Text fw={500} size={isMobile ? 'md' : 'lg'}>Annual Income</Text>
                            <Tooltip label="Your current annual income before tax">
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
                      />

                      <Box>
                        <Group justify="space-between" mb="xs">
                          <Text size={isMobile ? 'sm' : 'md'} fw={500}>Advanced Options</Text>
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
                          <NumberInput
                            label={
                              <Group gap="xs">
                                <Text fw={500} size={isMobile ? 'md' : 'lg'}>Expected Annual Salary Increase (%)</Text>
                                <Tooltip label="Estimated yearly percentage increase in your salary">
                                  <IconInfoCircle size={18} style={{ cursor: 'help' }} />
                                </Tooltip>
                              </Group>
                            }
                            placeholder="Enter expected salary increase"
                            size={isMobile ? 'md' : 'lg'}
                            min={0}
                            max={100}
                            step={0.5}
                            hideControls
                            clampBehavior="strict"
                            {...form.getInputProps('expectedSalaryIncrease')}
                            rightSection={<IconPercentage size={18} />}
                          />
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
                            <Tooltip label="The chart shows your projected HECS debt balance and annual repayments over time">
                              <ActionIcon variant="subtle" radius="xl" size={isMobile ? 'md' : 'lg'}>
                                <IconInfoCircle style={{ cursor: 'help' }} />
                              </ActionIcon>
                            </Tooltip>
                          </Group>
                          
                          <Text size="sm" c="dimmed">
                            Track how your HECS debt decreases over time as you make repayments, accounting for indexation and salary increases.
                          </Text>

                          <Box style={{ height: isMobile ? 300 : 500 }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart
                                data={result.yearlyData}
                                margin={{ 
                                  top: 20, 
                                  right: 30, 
                                  left: isMobile ? 10 : 30, 
                                  bottom: 10 
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
                                    offset: -5,
                                    fontSize: isMobile ? 12 : 14,
                                    fill: 'var(--mantine-color-gray-7)'
                                  }} 
                                  tick={{ 
                                    fontSize: isMobile ? 12 : 14, 
                                    fill: 'var(--mantine-color-gray-7)',
                                    dy: 5
                                  }}
                                  axisLine={{ stroke: 'var(--mantine-color-gray-4)' }}
                                  tickLine={{ stroke: 'var(--mantine-color-gray-4)' }}
                                />
                                <YAxis 
                                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                                  label={{ 
                                    value: 'Amount', 
                                    angle: -90, 
                                    position: 'insideLeft',
                                    offset: isMobile ? 0 : 10,
                                    fontSize: isMobile ? 12 : 14,
                                    fill: 'var(--mantine-color-gray-7)'
                                  }}
                                  tick={{ 
                                    fontSize: isMobile ? 12 : 14, 
                                    fill: 'var(--mantine-color-gray-7)',
                                    dx: -5
                                  }}
                                  axisLine={{ stroke: 'var(--mantine-color-gray-4)' }}
                                  tickLine={{ stroke: 'var(--mantine-color-gray-4)' }}
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
                              <Box w={12} h={12} style={{ 
                                backgroundColor: 'var(--mantine-color-blue-6)',
                                borderRadius: '50%'
                              }} />
                              <Text size="sm">Remaining Debt: Your outstanding HECS balance over time</Text>
                            </Group>
                            <Group gap="xs">
                              <Box w={12} h={12} style={{ 
                                backgroundColor: 'var(--mantine-color-green-6)',
                                borderRadius: '50%'
                              }} />
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
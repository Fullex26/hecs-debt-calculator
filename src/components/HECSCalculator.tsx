import { useForm } from '@mantine/form';
import { 
  Button, Paper, Title, Stack, NumberInput, Box, Text, Grid, 
  Tooltip, ThemeIcon, Divider, Timeline,
  Card, Group, Container, ActionIcon, Collapse
} from '@mantine/core';
import { useState } from 'react';
import { 
  IconInfoCircle, IconCalculator, IconPercentage,
  IconChevronDown, IconChevronUp
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

export function HECSCalculator() {
  const form = useForm({
    initialValues: {
      currentDebt: 0,
      annualIncome: 0,
      expectedSalaryIncrease: 3,
    },
    validate: {
      currentDebt: (value) => (value < 0 ? 'Debt cannot be negative' : null),
      annualIncome: (value) => (value < 0 ? 'Income cannot be negative' : null),
      expectedSalaryIncrease: (value) => (value < 0 || value > 100 ? 'Please enter a valid percentage between 0 and 100' : null),
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

  const [result, setResult] = useState<CalculationResult | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = form.onSubmit((values) => {
    const calculationResult = calculateRepayment(values.annualIncome);
    setResult(calculationResult);
  });

  const formatCurrency = (value: number) => 
    value.toLocaleString('en-AU', { 
      style: 'currency', 
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

  return (
    <Box>
      <Paper p="xl" radius={0} style={{ minHeight: '100vh' }}>
        <Container size="xl">
          <Stack gap="xl">
            {/* Header Section */}
            <Box style={{ textAlign: 'center' }} pt="xl">
              <ThemeIcon size={80} radius={80} mb="md" variant="light">
                <IconCalculator size={40} />
              </ThemeIcon>
              <Title order={1} size="h1">HECS Debt Calculator</Title>
              <Text c="dimmed" size="lg" mt="xs" maw={600} mx="auto">
                Plan your future with our comprehensive HECS-HELP loan calculator. Calculate your repayments, track milestones, and understand your debt journey.
              </Text>
            </Box>

            <Divider />

            {/* Form Section */}
            <form onSubmit={handleSubmit}>
              <Grid gutter="xl">
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Card withBorder shadow="sm" radius="md" p="xl">
                    <NumberInput
                      label={
                        <Group gap="xs">
                          <Text fw={500} size="lg">Current HECS Debt</Text>
                          <Tooltip label="Your current HECS-HELP loan balance">
                            <IconInfoCircle size={18} style={{ cursor: 'help' }} />
                          </Tooltip>
                        </Group>
                      }
                      placeholder="Enter your current HECS debt"
                      size="lg"
                      {...form.getInputProps('currentDebt')}
                      min={0}
                    />
                  </Card>
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Card withBorder shadow="sm" radius="md" p="xl">
                    <Stack gap="md">
                      <NumberInput
                        label={
                          <Group gap="xs">
                            <Text fw={500} size="lg">Annual Income</Text>
                            <Tooltip label="Your current annual income before tax">
                              <IconInfoCircle size={18} style={{ cursor: 'help' }} />
                            </Tooltip>
                          </Group>
                        }
                        placeholder="Enter your annual income"
                        size="lg"
                        {...form.getInputProps('annualIncome')}
                        min={0}
                      />

                      <Box>
                        <Group justify="space-between" mb="xs">
                          <Text size="md" fw={500}>Advanced Options</Text>
                          <ActionIcon 
                            variant="subtle" 
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            size="lg"
                          >
                            {showAdvanced ? <IconChevronUp size={20} /> : <IconChevronDown size={20} />}
                          </ActionIcon>
                        </Group>
                        
                        <Collapse in={showAdvanced}>
                          <NumberInput
                            label={
                              <Group gap="xs">
                                <Text fw={500} size="lg">Expected Annual Salary Increase (%)</Text>
                                <Tooltip label="Estimated yearly percentage increase in your salary">
                                  <IconInfoCircle size={18} style={{ cursor: 'help' }} />
                                </Tooltip>
                              </Group>
                            }
                            placeholder="Enter expected salary increase"
                            size="lg"
                            min={0}
                            max={100}
                            step={0.5}
                            {...form.getInputProps('expectedSalaryIncrease')}
                            rightSection={<IconPercentage size={18} />}
                          />
                        </Collapse>
                      </Box>
                    </Stack>
                  </Card>
                </Grid.Col>
              </Grid>

              <Group justify="center" mt="xl">
                <Button 
                  type="submit"
                  size="xl"
                  rightSection={<IconCalculator size={20} />}
                >
                  Calculate Repayments
                </Button>
              </Group>
            </form>

            {/* Results Section */}
            {result && (
              <>
                <Divider label={<Title order={2}>Results</Title>} labelPosition="center" size="sm" />
                
                <Grid gutter="xl">
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Card withBorder shadow="sm" radius="md" p="xl">
                      <Stack gap="lg">
                        <Title order={2}>Key Figures</Title>
                        <Grid>
                          <Grid.Col span={6}>
                            <Text size="lg" c="dimmed">Repayment Rate</Text>
                            <Text fw={700} size="xl">{result.repaymentRate}%</Text>
                          </Grid.Col>
                          <Grid.Col span={6}>
                            <Text size="lg" c="dimmed">Years to Repay</Text>
                            <Text fw={700} size="xl">{result.yearsToRepay}</Text>
                          </Grid.Col>
                          <Grid.Col span={6}>
                            <Text size="lg" c="dimmed">Annual Repayment</Text>
                            <Text fw={700} size="xl">{formatCurrency(result.annualRepayment)}</Text>
                          </Grid.Col>
                          <Grid.Col span={6}>
                            <Text size="lg" c="dimmed">Weekly Repayment</Text>
                            <Text fw={700} size="xl">{formatCurrency(result.weeklyRepayment)}</Text>
                          </Grid.Col>
                        </Grid>
                      </Stack>
                    </Card>
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Card withBorder shadow="sm" radius="md" p="xl">
                      <Stack gap="lg">
                        <Title order={2}>Total Costs</Title>
                        <Grid>
                          <Grid.Col span={6}>
                            <Text size="lg" c="dimmed">Total Interest</Text>
                            <Text fw={700} size="xl">{formatCurrency(result.totalInterestPaid)}</Text>
                          </Grid.Col>
                          <Grid.Col span={6}>
                            <Text size="lg" c="dimmed">Total Repayments</Text>
                            <Text fw={700} size="xl">{formatCurrency(result.totalRepayments)}</Text>
                          </Grid.Col>
                          <Grid.Col span={12}>
                            <Text size="lg" c="dimmed">Next Year's Balance (with Indexation)</Text>
                            <Text fw={700} size="xl">{formatCurrency(result.totalWithIndexation)}</Text>
                          </Grid.Col>
                        </Grid>
                      </Stack>
                    </Card>
                  </Grid.Col>
                </Grid>

                {/* Chart Section */}
                <Card withBorder shadow="sm" radius="md" p="xl">
                  <Title order={2} mb="xl">Repayment Projection</Title>
                  <Box style={{ height: 500 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={result.yearlyData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="year" 
                          label={{ value: 'Year', position: 'insideBottom', offset: -5 }} 
                        />
                        <YAxis 
                          tickFormatter={(value) => `$${value.toLocaleString()}`}
                          label={{ 
                            value: 'Amount ($)', 
                            angle: -90, 
                            position: 'insideLeft',
                            offset: 10
                          }}
                        />
                        <RechartsTooltip 
                          formatter={(value) => [`$${value.toLocaleString()}`, '']}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="remainingDebt" 
                          name="Remaining Debt"
                          stroke="#1c7ed6" 
                          strokeWidth={2}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="annualRepayment" 
                          name="Annual Repayment"
                          stroke="#40c057" 
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </Card>

                {/* Milestones Section */}
                <Card withBorder shadow="sm" radius="md" p="xl">
                  <Title order={2} mb="xl">Repayment Milestones</Title>
                  <Timeline active={result.projectionMilestones.length - 1} bulletSize={32} lineWidth={2}>
                    {result.projectionMilestones.map((milestone, index) => (
                      <Timeline.Item
                        key={index}
                        title={<Text size="lg" fw={500}>{milestone.description}</Text>}
                        color={
                          milestone.type === 'success' 
                            ? 'green' 
                            : milestone.type === 'warning' 
                              ? 'yellow' 
                              : 'blue'
                        }
                      >
                        <Text size="md">Year {milestone.year}</Text>
                        <Text size="lg" fw={500}>
                          {formatCurrency(milestone.value)}
                        </Text>
                      </Timeline.Item>
                    ))}
                  </Timeline>
                </Card>
              </>
            )}
          </Stack>
        </Container>
      </Paper>
    </Box>
  );
} 
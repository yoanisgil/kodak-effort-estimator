import React, {useState, useEffect} from 'react';
import {
    Container, Typography, MenuItem, Select, InputLabel, FormControl,
    TextField, Button, Box, Paper, Grid, FormControlLabel, Checkbox
} from '@mui/material';
import {BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer} from 'recharts';

// Task metadata based on Kodak Table 1.21
const taskOptions = [
    {label: 'Desk work (typing)', value: 'desk'},
    {label: 'Machine operation (standing, some lifting)', value: 'machine'},
    {label: 'Manual labor (lifting >20kg)', value: 'manual'},
    {label: 'Walking + lifting (e.g. warehouse)', value: 'walking'},
    {label: 'High-intensity labor (e.g. shoveling)', value: 'heavy'},
];

const effortLevels = {
    desk: {level: 'Light', o2: [3, 6], kcal: [1, 2]},
    machine: {level: 'Moderate', o2: [7, 11], kcal: [2.5, 4]},
    manual: {level: 'Mod–Heavy', o2: [10, 14], kcal: [3.5, 5.2]},
    walking: {level: 'Mod–Heavy', o2: [10, 14], kcal: [3.5, 5.2]},
    heavy: {level: 'Very Heavy', o2: [15, 25], kcal: [5.5, 9]},
};

export default function EffortEstimatorApp() {
    const [task, setTask] = useState('');
    const [weight, setWeight] = useState(75);
    const [duration, setDuration] = useState(60);
    const [overrideEnabled, setOverrideEnabled] = useState(false);
    const [customKcalMin, setCustomKcalMin] = useState('');
    const [customKcalMax, setCustomKcalMax] = useState('');
    const [customO2Min, setCustomO2Min] = useState('');
    const [customO2Max, setCustomO2Max] = useState('');
    const [result, setResult] = useState(null);
    const [filterText, setFilterText] = useState('');
    const [filterLevel, setFilterLevel] = useState('');

    // Automatically estimate when all inputs are available
    useEffect(() => {
        if (!task || !weight || !duration) return;

        const base = effortLevels[task];
        const level = base.level;

        const kcalBase = overrideEnabled && customKcalMin && customKcalMax
            ? [parseFloat(customKcalMin), parseFloat(customKcalMax)]
            : base.kcal;

        const o2Base = overrideEnabled && customO2Min && customO2Max
            ? [parseFloat(customO2Min), parseFloat(customO2Max)]
            : base.o2;

        const kcalMin = kcalBase.map(k => (k * weight / 75).toFixed(1));
        const kcalRange = `${kcalMin[0]} – ${kcalMin[1]}`;
        const totalRange = kcalMin.map(k => (k * duration).toFixed(1));
        const totalKcal = `${totalRange[0]} – ${totalRange[1]}`;
        const o2Range = `${o2Base[0]} – ${o2Base[1]}`;

        setResult({level, o2Range, kcalRange, totalKcal});
    }, [task, weight, duration, overrideEnabled, customKcalMin, customKcalMax, customO2Min, customO2Max]);

    const chartData = Object.entries(effortLevels).map(([key, {kcal}]) => {
        const kcalBase = (overrideEnabled && key === task && customKcalMin && customKcalMax)
            ? [parseFloat(customKcalMin), parseFloat(customKcalMax)]
            : kcal;

        return {
            task: taskOptions.find(t => t.value === key)?.label,
            kcalMin: +(kcalBase[0] * weight / 75).toFixed(1),
            kcalMax: +(kcalBase[1] * weight / 75).toFixed(1),
        };
    });

    const filteredTable = taskOptions.filter(opt => {
        const entry = effortLevels[opt.value];
        const matchText = opt.label.toLowerCase().includes(filterText.toLowerCase());
        const matchLevel = filterLevel ? entry.level === filterLevel : true;
        return matchText && matchLevel;
    });

    return (
        <Container maxWidth="xl" sx={{mt: 5, mb: 8}}>
            <Grid container spacing={4}>
                {/* Estimator Form */}
                <Grid item xs={12} md={6} lg={4}>
                    <Paper sx={{p: 4}}>
                        <Typography variant="h5" gutterBottom>Effort Level Estimator</Typography>

                        <Box sx={{display: 'flex', flexDirection: 'column', gap: 2}}>
                            <FormControl fullWidth>
                                <InputLabel>Select Task</InputLabel>
                                <Select value={task} label="Select Task" onChange={e => setTask(e.target.value)}>
                                    {taskOptions.map(opt => (
                                        <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <TextField
                                fullWidth
                                label="Your Weight (kg)"
                                type="number"
                                value={weight}
                                onChange={e => setWeight(+e.target.value)}
                            />

                            <TextField
                                fullWidth
                                label="Duration (minutes)"
                                type="number"
                                value={duration}
                                onChange={e => setDuration(+e.target.value)}
                            />

                            <FormControlLabel
                                control={<Checkbox checked={overrideEnabled}
                                                   onChange={(e) => setOverrideEnabled(e.target.checked)}/>}
                                label="Override kcal/min & oxygen values"
                            />

                            {overrideEnabled && (
                                <Box sx={{display: 'flex', flexDirection: 'column', gap: 2}}>
                                    <Box sx={{display: 'flex', gap: 2}}>
                                        <TextField
                                            label="Custom Min kcal/min"
                                            type="number"
                                            value={customKcalMin}
                                            onChange={(e) => setCustomKcalMin(e.target.value)}
                                            fullWidth
                                        />
                                        <TextField
                                            label="Custom Max kcal/min"
                                            type="number"
                                            value={customKcalMax}
                                            onChange={(e) => setCustomKcalMax(e.target.value)}
                                            fullWidth
                                        />
                                    </Box>
                                    <Box sx={{display: 'flex', gap: 2}}>
                                        <TextField
                                            label="Custom Min O₂ (ml/kg/min)"
                                            type="number"
                                            value={customO2Min}
                                            onChange={(e) => setCustomO2Min(e.target.value)}
                                            fullWidth
                                        />
                                        <TextField
                                            label="Custom Max O₂ (ml/kg/min)"
                                            type="number"
                                            value={customO2Max}
                                            onChange={(e) => setCustomO2Max(e.target.value)}
                                            fullWidth
                                        />
                                    </Box>
                                </Box>
                            )}
                        </Box>
                    </Paper>
                </Grid>

                {/* Results & Table */}
                <Grid item xs={12} md={6} lg={8}>
                    <Grid container spacing={2}>
                        {/* Results */}
                        <Grid item xs={12} md={6}>
                            <Paper sx={{p: 4, height: '100%'}}>
                                <Typography variant="h6" gutterBottom>Estimation Results</Typography>
                                {result ? (
                                    <Box>
                                        <Typography><strong>Effort Level:</strong> {result.level}</Typography>
                                        <Typography><strong>Oxygen
                                            Demand:</strong> {result.o2Range} ml/kg/min</Typography>
                                        <Typography><strong>Energy
                                            Expenditure:</strong> {result.kcalRange} kcal/min</Typography>
                                        <Typography><strong>Total Energy:</strong> {result.totalKcal} kcal</Typography>

                                        <Typography variant="subtitle2" sx={{mt: 2, color: 'gray'}}>
                                            Formula:<br/>
                                            kcal/min = base × (weight / 75)<br/>
                                            Total kcal = kcal/min × duration<br/>
                                            O₂ demand is task-specific (or overridden)
                                        </Typography>
                                    </Box>
                                ) : (
                                    <Typography variant="body2" color="text.secondary">
                                        Fill out the form to see estimated values.
                                    </Typography>
                                )}
                            </Paper>
                        </Grid>

                        {/* Kodak Table */}
                        <Grid item xs={12} md={6}>
                            <Paper sx={{p: 3}}>
                                <Typography variant="h6" gutterBottom>Kodak Effort Levels (Table 1.21)</Typography>
                                <Box sx={{display: 'flex', gap: 2, mb: 2}}>
                                    <TextField
                                        label="Search Task"
                                        value={filterText}
                                        onChange={(e) => setFilterText(e.target.value)}
                                        fullWidth
                                    />
                                    <FormControl fullWidth>
                                        <InputLabel>Filter by Effort</InputLabel>
                                        <Select
                                            value={filterLevel}
                                            onChange={e => setFilterLevel(e.target.value)}
                                            label="Filter by Effort"
                                        >
                                            <MenuItem value="">All</MenuItem>
                                            {[...new Set(Object.values(effortLevels).map(e => e.level))].map(level => (
                                                <MenuItem key={level} value={level}>{level}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Box>
                                <Paper sx={{overflowX: 'auto'}}>
                                    <table style={{width: '100%', borderCollapse: 'collapse'}}>
                                        <thead style={{background: '#f5f5f5'}}>
                                        <tr>
                                            <th style={th}>Task</th>
                                            <th style={th}>Effort Level</th>
                                            <th style={th}>kcal/min</th>
                                            <th style={th}>O₂ (ml/kg/min)</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {filteredTable.map(opt => {
                                            const {kcal, o2, level} = effortLevels[opt.value];
                                            return (
                                                <tr key={opt.value}>
                                                    <td style={td}>{opt.label}</td>
                                                    <td style={td}>{level}</td>
                                                    <td style={td}>{`${kcal[0]} – ${kcal[1]}`}</td>
                                                    <td style={td}>{`${o2[0]} – ${o2[1]}`}</td>
                                                </tr>
                                            );
                                        })}
                                        </tbody>
                                    </table>
                                </Paper>
                            </Paper>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>

            {/* Chart */}
            <Box sx={{mt: 6}}>
                <Typography variant="h6" gutterBottom>
                    kcal/min by Task (Based on Your Weight)
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                        <XAxis dataKey="task"/>
                        <YAxis/>
                        <Tooltip/>
                        <Bar dataKey="kcalMin" fill="#1976d2" name="Min kcal/min"/>
                        <Bar dataKey="kcalMax" fill="#64b5f6" name="Max kcal/min"/>
                    </BarChart>
                </ResponsiveContainer>
            </Box>
        </Container>
    );
}

// Table styles
const th = {
    padding: '10px',
    textAlign: 'left',
    borderBottom: '2px solid #ddd',
    fontWeight: 'bold'
};

const td = {
    padding: '10px',
    borderBottom: '1px solid #ddd'
};

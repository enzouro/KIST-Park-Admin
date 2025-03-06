/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Box, Typography, FormControl, FormHelperText, TextField, TextareaAutosize, Stack, Select, MenuItem } from '@pankod/refine-mui';

import { FormPropsProcurement } from 'interfaces/common';
import CustomButton from './CustomButton';

const ProcurementForm = ({ type, register, handleSubmit, formLoading, onFinishHandler }: FormPropsProcurement) => (
  <Box>
    <Typography fontSize={25} fontWeight={700} color="#11142D">{type} a Procurement</Typography>

    <Box mt={2.5} borderRadius="15px" padding="20px" bgcolor="#FCFCFC">
      <form
        style={{ marginTop: '20px', width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}
        onSubmit={handleSubmit(onFinishHandler)}
      >
        <FormControl>
          <FormHelperText sx={{ fontWeight: 500, margin: '10px 0', fontSize: 16, color: '#11142D' }}>Enter procurement name</FormHelperText>
          <TextField
            fullWidth
            required
            id="outlined-basic"
            color="info"
            variant="outlined"
            {...register('title', { required: true })}
          />
        </FormControl>

        <FormControl>
          <FormHelperText sx={{ fontWeight: 500, margin: '10px 0', fontSize: 16, color: '#11142D' }}>Procurement Description</FormHelperText>
          <TextareaAutosize
            minRows={5}
            required
            placeholder="Write description of procurement"
            color="info"
            style={{ width: '100%', background: 'transparent', fontSize: '16px', borderColor: 'rgba(0, 0, 0, 0.23)', borderRadius: 6, padding: 10, color: '#919191' }}
            {...register('description', { required: true })}
          />
        </FormControl>

        <Stack direction="row" gap={4}>
          <FormControl sx={{ flex: 1 }}>
            <FormHelperText
              sx={{
                fontWeight: 500,
                margin: '10px 0',
                fontSize: 16,
                color: '#11142D',
              }}
            >
              Enter procurement type
            </FormHelperText>
            <Select
              variant="outlined"
              color="info"
              displayEmpty
              required
              inputProps={{ 'aria-label': 'Without label' }}
              defaultValue="apartment"
              {...register('procurementType', { required: true })}
            >
              <MenuItem value="apartment">Apartment</MenuItem>
              <MenuItem value="villa">Villa</MenuItem>
              <MenuItem value="farmhouse">Farmhouse</MenuItem>
              <MenuItem value="condos">Condos</MenuItem>
              <MenuItem value="townhouse">Townhouse</MenuItem>
              <MenuItem value="duplex">Duplex</MenuItem>
              <MenuItem value="studio">Studio</MenuItem>
              <MenuItem value="chalet">Chalet</MenuItem>
            </Select>
          </FormControl>

          <FormControl sx={{ flex: 1 }}>
            <FormHelperText sx={{ fontWeight: 500, margin: '10px 0', fontSize: 16, color: '#11142D' }}>Enter procurement price</FormHelperText>
            <TextField
              fullWidth
              required
              id="outlined-basic"
              variant="outlined"
              color="info"
              type="number"
              {...register('price', { required: true })}
            />
          </FormControl>
        </Stack>

        <FormControl>
          <FormHelperText sx={{ fontWeight: 500, margin: '10px 0', fontSize: 16, color: '#11142D' }}>Enter location</FormHelperText>
          <TextField
            fullWidth
            required
            id="outlined-basic"
            variant="outlined"
            color="info"
            {...register('location', { required: true })}
          />
        </FormControl>

        <CustomButton
          type="submit"
          title={formLoading ? 'Submitting...' : 'Submit'}
          backgroundColor="#475BE8"
          color="#FCFCFC"
        />
      </form>
    </Box>
  </Box>
);

export default ProcurementForm;

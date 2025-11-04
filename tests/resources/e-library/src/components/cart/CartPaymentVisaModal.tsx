import { InputLabel, MenuItem, Select, TextField, FormControl, Button } from "@mui/material";
import { Form, Formik } from "formik";
import { toast } from "react-toastify";
import * as Yup from "yup";
import { months, years } from "@/constants/yearsMonths";

export const CartPaymentVisaModal = ({onBack, onPayment}: {onBack: (index: number) => void, onPayment: () => void}) => {

    const visaFormSchema = Yup.object({
        cardOwner: Yup.string()
            .min(5)
            .max(50)
            .required("Card Owner full name is required."),
        cardNumber: Yup.string()
            .transform((value) => value.replace(/\s+/g, ''))
            .matches(/^\d{16}$/, "Card Number must be exactly 16 digits.")
            .required("Card Number is required."),
        cvv: Yup.string()
            .transform((value) => value.replace(/\s+/g, ''))
            .matches(/^\d{3}$/, "CVV must be exactly 3 digits.")
            .required("CVV is required."),
        expiryMonth: Yup.string()
            .required("Month is required"),
        expiryYear: Yup.string()
            .required("Year is required"),
    });

    const handleSubmit = (values: {
        cardOwner: string;
        cardNumber: string;
        cvv: string;
    }) => {
        toast.success("Payment is accepted!");
        setTimeout(() => {
            window.location.reload();
        }, 5000)
    }

    return(
        <div className="mt-8 ml-[45px]">
            <Formik
                initialValues={{
                    cardOwner: "",
                    cardNumber: "",
                    cvv: "",
                    expiryMonth: "",
                    expiryYear: "",
                }}
                validationSchema={visaFormSchema}
                onSubmit={handleSubmit}
                validateOnMount={true}>
                    {({ handleChange, handleBlur, values, errors, touched, isValid }) => (
                        <div className="flex w-[800px] bg-gray-400 pb-5">
                             <Form className="space-y-4 mt-6 w-[750px]">
                                <div className="flex-col">
                                    <TextField
                                        className="ml-[20px] w-[600px] rounded-xl"
                                        fullWidth
                                        required={true}
                                        label="Card Owner"
                                        name="cardOwner"
                                        value={values.cardOwner}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        error={touched.cardOwner && Boolean(errors.cardOwner)}
                                        helperText={touched.cardOwner && errors.cardOwner}
                                        variant="outlined"
                                        sx={{
                                            mb: 2,
                                        input: { color: 'black' },
                                            '& .MuiOutlinedInput-root': {
                                                backgroundColor: '#8497ecff',
                                                borderRadius: '8px',
                                                '& fieldset': {
                                                },
                                                '&:hover fieldset': {
                                                borderColor: 'lightgray',
                                                },
                                                '&.Mui-focused fieldset': {
                                                borderColor: 'white',
                                                },
                                            },
                                        }}
                                        />
                                    <TextField
                                        className="ml-[20px] w-[100px] rounded-xl"
                                        fullWidth
                                        label="CVV"
                                        onBlur={handleBlur}
                                        name="cvv"
                                        required={true}
                                        value={values.cvv}
                                        onChange={handleChange}
                                        error={touched.cvv && Boolean(errors.cvv)}
                                        helperText={touched.cvv && errors.cvv}
                                        variant="outlined"
                                        sx={{
                                            mb: 2,
                                            input: { color: 'black' },
                                            '& .MuiOutlinedInput-root': {
                                                backgroundColor: '#8497ecff',
                                                borderRadius: '8px',
                                                '& fieldset': {
                                                },
                                                '&:hover fieldset': {
                                                borderColor: 'lightgray',
                                                },
                                                '&.Mui-focused fieldset': {
                                                borderColor: 'white',
                                                },
                                            },
                                        }}
                                    />
                                </div>
                                
                                <TextField
                                    className="ml-[20px] w-[400px] rounded-xl"
                                    fullWidth
                                    label="Card Number. E.g. 1234 5678 9012 3456"
                                    name="cardNumber"
                                    value={values.cardNumber}
                                    onBlur={handleBlur}
                                    required={true}
                                    onChange={handleChange}
                                    error={touched.cardNumber && Boolean(errors.cardNumber)}
                                    helperText={touched.cardNumber && errors.cardNumber}
                                    variant="outlined"
                                    sx={{
                                        mb: 2,
                                       input: { color: 'black' },
                                        '& .MuiOutlinedInput-root': {
                                            backgroundColor: '#8497ecff',
                                            borderRadius: '8px',
                                            '& fieldset': {
                                            },
                                            '&:hover fieldset': {
                                            borderColor: 'lightgray',
                                            },
                                            '&.Mui-focused fieldset': {
                                            borderColor: 'white',
                                            },
                                        },
                                    }}
                                />

                                <FormControl className="ml-[90px] w-[100px]"
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            backgroundColor: '#8497ecff',
                                            borderRadius: '8px',
                                            '&:hover fieldset': {
                                                borderColor: 'lightgray',
                                            },
                                            '&.Mui-focused fieldset': {
                                                borderColor: 'white',
                                            },
                                        },
                                        '& .MuiInputBase-input': { color: 'black' },
                                        '& .MuiInputLabel-root': { color: 'black' }
                                    }}>
                                    <InputLabel>Month</InputLabel>
                                    <Select
                                        name="expiryMonth"
                                        value={values.expiryMonth}
                                        onChange={handleChange}
                                        error={touched.expiryMonth && Boolean(errors.expiryMonth)}
                                    >
                                        {months.map((m) => (
                                        <MenuItem key={m.value} value={m.value}>
                                            {m.label}
                                        </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <FormControl className="ml-[30px] w-[100px]"
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            backgroundColor: '#8497ecff',
                                            borderRadius: '8px',
                                            '&:hover fieldset': {
                                                borderColor: 'lightgray',
                                            },
                                            '&.Mui-focused fieldset': {
                                                borderColor: 'white',
                                            },
                                        },
                                        '& .MuiInputBase-input': { color: 'black' },
                                        '& .MuiInputLabel-root': { color: 'black' }
                                    }}>
                                <InputLabel>Year</InputLabel>
                                <Select
                                    name="expiryYear"
                                    value={values.expiryYear}
                                    onChange={handleChange}
                                    error={touched.expiryYear && Boolean(errors.expiryYear)}
                                >
                                    {years.map((y) => (
                                    <MenuItem key={y.value} value={y.value}>
                                        {y.label}
                                    </MenuItem>
                                    ))}
                                </Select>
                                </FormControl>
                                <div className="flex justify-end">
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        color="primary"
                                        className="mr-[380px] w-[150px] h-[40px] mt-4 text-black rounded-xl"
                                        sx={{
                                            textTransform: "none",
                                            background: "#8497ecff",
                                            "&:hover": { background: "#f32121ff" },
                                        }}
                                        onClick={() => onBack(1)}
                                    >
                                        Back to Address Form
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        color="primary"
                                        className="ml-[40px] w-[150px] h-[40px] mt-4 text-black rounded-xl"
                                        sx={{
                                            textTransform: "none",
                                            background: "#8497ecff",
                                            "&:hover": { background: "#2cf321ff" },
                                        }}
                                        disabled={!isValid}
                                        onClick={() => onPayment()}
                                    >
                                        Pay
                                    </Button>
                                </div>
                             </Form>
                        </div>
                    )}
                     
            </Formik>
        </div>
    );
}
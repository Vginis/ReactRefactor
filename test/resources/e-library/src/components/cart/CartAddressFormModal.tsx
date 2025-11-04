import { Address } from "@/intefaces/interfaces";
import { Button, TextField } from "@mui/material"
import { Form, Formik } from "formik";
import { toast } from "react-toastify";
import * as Yup from "yup";

export const CartAddressFormModal = ({onBack, onNext, setAddress}: {onBack: (index: number) => void,
     onNext: (index: number) => void, setAddress: (address: Address) => void}) => {
    const addressFormSchema = Yup.object({
        address: Yup.string()
            .min(5)
            .max(100)
            .required("Address is required."),
        number: Yup.string()
            .min(1)
            .matches(/^[0-9]+$/, "Address number must contain only digits.")
            .required("Address number is required."),
        postalCode: Yup.string()
            .matches(/^[0-9]+$/, "Postal code must contain only digits.")
            .length(5, "Postal code must be exactly 5 digits.")
            .required("Postal code is required."),
        floor: Yup.string()
            .min(1, "The floor must have at least one character.")
            .max(5, "The floor must have at most five characters.")
            .required("Please provide the floor you stay."),
        doorbellName: Yup.string()
            .min(2)
            .max(50, "The doorbell name must not be larger than 50 characters.")
            .required("Please provide your doorbell's name.")
    });


    const handleSubmit = (values: {
        address: string;
        number: string;
        postalCode: string;
        floor: string;
        doorbellName: string;
    }) => {
        const address = {
            address: values.address,
            number: values.number,
            postalCode: values.postalCode,
            floor: values.floor,
            doorbellName: values.doorbellName
        }
        setAddress(address);
        toast.success("Proceeding to payment!");
    }

    return(
        <div className="flex-col ml-[40px] h-[330px] mt-[115px] bg-gray-300 p-2 w-[800px]">
            <Formik
                initialValues={{
                    address: "",
                    number: "",
                    postalCode: "",
                    floor: "",
                    doorbellName: "",
                }}
                validationSchema={addressFormSchema}
                onSubmit={handleSubmit}
                validateOnMount={true}>
                {({ handleChange, handleBlur, values, errors, touched, isValid }) => (
                    <div className="w-[800px] pb-5">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                            Delivery Address
                        </h2>

                        <Form className="space-y-4 mt-6 w-[750px]">
                            <div className="flex-col">
                                <TextField
                                    className="ml-[20px] w-[600px] rounded-xl"
                                    fullWidth
                                    required={true}
                                    label="Address"
                                    name="address"
                                    value={values.address}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    error={touched.address && Boolean(errors.address)}
                                    helperText={touched.address && errors.address}
                                    variant="outlined"
                                    sx={{
                                        mb: 2,
                                    input: { color: 'black' },
                                        '& .MuiOutlinedInput-root': {
                                            backgroundColor: '#c2c9e7ff',
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
                                    label="Number"
                                    onBlur={handleBlur}
                                    name="number"
                                    required={true}
                                    value={values.number}
                                    onChange={handleChange}
                                    error={touched.number && Boolean(errors.number)}
                                    helperText={touched.number && errors.number}
                                    variant="outlined"
                                    sx={{
                                        mb: 2,
                                        input: { color: 'black' },
                                        '& .MuiOutlinedInput-root': {
                                            backgroundColor: '#c2c9e7ff',
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
                                    className="ml-[20px] w-[150px] rounded-xl"
                                    fullWidth
                                    label="Postal Code"
                                    onBlur={handleBlur}
                                    name="postalCode"
                                    required={true}
                                    value={values.postalCode}
                                    onChange={handleChange}
                                    error={touched.postalCode && Boolean(errors.postalCode)}
                                    helperText={touched.postalCode && errors.postalCode}
                                    variant="outlined"
                                    sx={{
                                        mb: 2,
                                        input: { color: 'black' },
                                        '& .MuiOutlinedInput-root': {
                                            backgroundColor: '#c2c9e7ff',
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
                                    className="ml-[50px] w-[100px] rounded-xl"
                                    fullWidth
                                    label="Floor"
                                    onBlur={handleBlur}
                                    name="floor"
                                    required={true}
                                    value={values.floor}
                                    onChange={handleChange}
                                    error={touched.floor && Boolean(errors.floor)}
                                    helperText={touched.floor && errors.floor}
                                    variant="outlined"
                                    sx={{
                                        mb: 2,
                                        input: { color: 'black' },
                                        '& .MuiOutlinedInput-root': {
                                            backgroundColor: '#c2c9e7ff',
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
                                    className="ml-[50px] w-[200px] rounded-xl"
                                    fullWidth
                                    label="Doorbell name"
                                    onBlur={handleBlur}
                                    name="doorbellName"
                                    required={true}
                                    value={values.doorbellName}
                                    onChange={handleChange}
                                    error={touched.doorbellName && Boolean(errors.doorbellName)}
                                    helperText={touched.doorbellName && errors.doorbellName}
                                    variant="outlined"
                                    sx={{
                                        mb: 2,
                                        input: { color: 'black' },
                                        '& .MuiOutlinedInput-root': {
                                            backgroundColor: '#c2c9e7ff',
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
                            <div className="flex justify-between mt-[30px]">
                                <Button
                                    onClick={() => onBack(0)}
                                    variant="contained"
                                    color="primary"
                                    className="w-[150px] ml-[20px] h-[40px] text-black rounded-xl"
                                    sx={{
                                        textTransform: "none",
                                        background: "#8497ecff",
                                        "&:hover": { background: "#2196f3" },
                                    }}
                                >
                                Back to Cart
                                </Button>

                                <Button
                                    onClick={() => onNext(2)}
                                    type="submit"
                                    variant="contained"
                                    color="primary"
                                    className="w-[150px] h-[40px] text-black rounded-xl"
                                    sx={{
                                        textTransform: "none",
                                        background: "#8497ecff",
                                        "&:hover": { background: "#1dcd3dff" },
                                    }}
                                    disabled={!isValid}
                                >
                                Move to Payment
                                </Button>
                            </div>
                        </Form>
                    </div>
                )}
                </Formik>
        </div>
    )
}
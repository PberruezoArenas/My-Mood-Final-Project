import ResetPassword from "../component/resetPassword";

const getState = ({ getStore, getActions, setStore }) => {
	return {


		store: {
			message: null,

			user: null,

			location: [],

			auth: false,


		},


		actions: {
			//mymood
			setAuth: (auth) => {
				setStore({ ...getStore(), auth: auth });
			},
			setUser: (user) => {
				setStore({ ...getStore(), user: user });
			},
			clearUser: () => {
				setStore({ ...getStore(), user: null });
			},

			login: async (email, password) => {
				try {
					const response = await fetch(`${process.env.BACKEND_URL}/api/login`, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json'
						},
						body: JSON.stringify({
							"email": email,
							"password": password
						})
					})
					const data = await response.json();
					if (response.status !== 200) {
						console.log("Login error:", response.status, data.msg);
						return false;
					}
					sessionStorage.setItem("userToken", data.access_token);
					sessionStorage.setItem("userData", JSON.stringify(data.user));

					// getActions().setUser(data.user);
					console.log(data);
					setStore({ ...getStore(), user: data.user });
					setStore({ ...getStore(), auth: true })
					return true;
				}
				catch (error) {
					console.log("Error en login:", error);
					return false;
				}
			},

			loginGoogle: async (response) => {
				console.log(response);
				const tokenId = response.credential;
				const result = await fetch(`${process.env.BACKEND_URL}/api/login-google`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ id_token: tokenId })
				});

				const data = await result.json();
				if (result.ok) {
					// Procesa el login exitoso
					console.log("Login successful:", data);
					sessionStorage.setItem('userToken', data.access_token);
					sessionStorage.setItem("userData", JSON.stringify(data.user));
					console.log(data.user);
					getActions().setUser(data.user);
					setStore({ ...getStore(), auth: true })
					return true;
				} else {
					console.error("Login failed:", data.message);
					return false;
				}
			},


			logout: async () => {
				const actions = getActions();
				try {
					const response = await fetch(process.env.BACKEND_URL + '/api/logout', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							'Authorization': 'Bearer ' + sessionStorage.getItem("userToken")
						}
					});

					const data = await response.json();

					if (response.ok) {
						console.log("Logout successful:", data);
						sessionStorage.removeItem("userToken");
						sessionStorage.removeItem("userData");
						setStore({ ...getStore(), auth: false })
						actions.clearUser();
					} else {
						throw new Error('Logout failed');
					}
				} catch (error) {
					console.error('Logout error:', error);
				}
			},

			resetPassword: async (token, password) => {
				try {
					const response = await fetch(`${process.env.BACKEND_URL}/api/reset-password/${token}`, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json'
						},
						body: JSON.stringify({ password })
					});

					if (!response.ok) {
						let errorMessage = 'Hubo un error al restablecer la contraseña';
						if (response.status === 400) {
							errorMessage = 'La solicitud es incorrecta';
						} else if (response.status === 404) {
							errorMessage = 'No se encontró el recurso';
						}
						throw new Error(errorMessage);
					}
					return response;
				} catch (error) {
					console.error("Error reset password:", error);
					return { ok: false, message: "Network error" };
				}
			},

			signUp: async (name, surnames, email, password) => {
				try {
					const response = await fetch(`${process.env.BACKEND_URL}/api/signup`, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json'
						},
						body: JSON.stringify({
							name,
							surnames,
							email,
							password
						})
					});
					const data = await response.json();
					if (response.ok) {
						setStore({ user: data.user });
						return { status: true, msg: "User created successfully." };
					} else {
						return { status: false, msg: data.msg };
					}
				} catch (error) {
					console.error("Error signing up:", error);
					return { status: false, msg: "Network error" };
				}
			},

			validToken: async () => {
				console.log("holaaaaa estooy en valid token");
				let token = sessionStorage.getItem("userToken");
				let user = JSON.parse(sessionStorage.getItem("userData"));

				if (!token) {
					console.log("Token not found");
					setStore({ ...getStore(), auth: false, user: null })
					return false;
				}
				try {
					const response = await fetch(`${process.env.BACKEND_URL}/api/valid-token`, {
						method: 'GET',
						headers: {
							'Content-Type': 'application/json',
							'Authorization': "Bearer " + token,
						},
					});
					const data = await response.json();
					console.log(data);
					if (response.status === 200) {
						setStore({ ...getStore(), auth: data.is_logged, user: user })
						console.log('Login successful:', data);
						return true;
					}
					else {
						sessionStorage.removeItem("userToken");
						sessionStorage.removeItem("userData");
						setStore({ ...getStore(), auth: false, user: null })
						return false;
					}
				} catch (error) {
					console.error('Token expired:', error);
					sessionStorage.removeItem("userToken");
					sessionStorage.removeItem("userData");
					setStore({ ...getStore(), auth: false, user: null })
					return false;
				}
			},

			deleteAccount: async (user_id) => {
				console.log("Eliminar usuario....");
				console.log(user_id);
				try {
					const response = await fetch(`${process.env.BACKEND_URL}/api/delete-account/${user_id}`, {
						method: 'DELETE',
						headers: {
							'Content-Type': 'application/json',
						},
					});
					const data = await response.json();

					if (response.ok) {
						console.log("La cuenta se eliminó correctamente");
						sessionStorage.removeItem("userToken");
						sessionStorage.removeItem("userData");
						getActions().clearUser();
						setStore({ ...getStore(), auth: false, user: null });
					} else {
						console.log("Hubo un error al eliminar la cuenta:", data.error);
					}
				} catch (error) {
					console.log("Error deleting account from database", error);
				}
			},

			// Backend is running
			getMessage: async () => {
				try  {
					// fetching data from the backend
					const resp = await fetch(process.env.BACKEND_URL + "/api/hello")
					const data = await resp.json()
					setStore({ message: data.message })
					// don't forget to return something, that is how the async resolves
					return data;
				}  catch  (error)  {
					console.log("Error loading message from backend", error)
				}
			},

			saveMood : async (mood) => {
                try {
                    const response = await fetch('/api/save-mood', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ mood: mood })
                    });
                    if (!response.ok) {
                        throw new Error('Error al guardar el estado de ánimo');
                    }
                    console.log('Estado de ánimo guardado correctamente');
                } catch (error) {
                    console.error('Error al guardar el estado de ánimo:', error);
                }
            },

	
			getAllActiveLocations: async () => {
				try {
					const urlActiveLocations = process.env.BACKEND_URL + `/api/users/active-locations`; 
					const response = await fetch(urlActiveLocations, {
						method: 'GET'
					});
			
					if (!response.ok) {
						throw new Error(`Failed to fetch active location data: ${response.status} ${response.statusText}`);
					}
			
					const data = await response.json();
			
					// Actualizar el estado con las ubicaciones de los usuarios activos
					console.log(data);
					setStore({ location: data });
					console.log("Active user locations loaded from the API to store.");
			
					return true;
				} catch (error) {
					console.error('Error fetching or processing active location data:', error);
					return false;
				}
			},


			saveUserLocation: async () => {
				try {
					// Obtén la ubicación del usuario
					const position = await new Promise((resolve, reject) => 
						navigator.geolocation.getCurrentPosition(resolve, reject));
			
					const latitude = position.coords.latitude;
					const longitude = position.coords.longitude;
			
					console.log("Latitud: " + latitude);
					console.log("Longitud: " + longitude);
			
					// Guarda la ubicación en el usuario
					const userId = JSON.parse(sessionStorage.userData).id;
					console.log("Id de usuario: " + userId);
					const urlLocation = process.env.BACKEND_URL + `/api/user/location`;
					console.log("URL de la API: " + urlLocation);
			
					const requestBody = JSON.stringify({ user_id: userId, latitude, longitude });
					console.log("Cuerpo de la solicitud: " + requestBody);
			
					const response = await fetch(urlLocation, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json'
						},
						body: requestBody,
					});
			
					console.log("Respuesta del servidor: ", response);
			
					if (!response.ok) {
						const responseBody = await response.text();
						console.error("Cuerpo de la respuesta del error: " + responseBody);
						throw new Error(`Error al obtener los datos de ubicación: ${response.status} ${response.statusText}`);
					}
			
					const data = await response.json();
			
					// Actualiza el estado con las ubicaciones
					console.log(data);
					setStore(prevState => ({
						...prevState,
						location: Array.isArray(prevState.location) ? [...prevState.location, data] : [data]
					}));
			
					console.log("Ubicaciones cargadas desde la API al almacenamiento.");
					return true
			
				} catch (error) {
					console.error('Error fetching or processing location data:', error);
					return false;
				}
			},


			requestUserLocation: async () => {
				try {
					// obtener la ubicación del usuario
					const position = await new Promise((resolve, reject) => {
						navigator.geolocation.getCurrentPosition(resolve, reject);
					});

					//  latitud y longitud de la ubicación obtenida
					const latitude = position.coords.latitude;
					const longitude = position.coords.longitude;

					// ubicación en el estado global (store)
					getActions().saveUserLocation(latitude, longitude),
					getActions().getAllActiveLocations(),
					setStore(prevState => ({
						...prevState,
						location: [{ latitude, longitude }]

					}));

				} catch (error) {
					console.error('Error getting user location:', error.message);

				}
			},

		}

	};
};


	export default getState;

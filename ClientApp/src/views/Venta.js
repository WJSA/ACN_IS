﻿
import { Card, CardBody, CardHeader, Col, FormGroup, Input, InputGroup, InputGroupText, Label, Row, Table, Button } from "reactstrap";
import Swal from 'sweetalert2'
import Autosuggest from 'react-autosuggest';
import { useContext, useState } from "react";
import "./css/Venta.css"
import { UserContext } from "../context/UserProvider";

const modelo = {
    nombre: "",
    correo: "",
    idRolNavigation: {
        idRol: 0,
        descripcion: ""
    }
}

const Venta = () => {
    const { user } = useContext(UserContext)

    const [a_Productos, setA_Productos] = useState([])
    const [a_Busqueda, setA_Busqueda] = useState("")

    const [documentoCliente, setDocumentoCliente] = useState("")
    const [nombreCliente, setNombreCliente] = useState("")

    const [tipoDocumento,setTipoDocumento] = useState("Debito")
    const [productos, setProductos] = useState([])
    const [total, setTotal] = useState(0)
    const [subTotal, setSubTotal] = useState(0)
    const [igv, setIgv] = useState(0)

    const reestablecer = () => {
        setDocumentoCliente("");
        setNombreCliente("")
        setTipoDocumento("Credito")
        setProductos([])
        setTotal(0)
        setSubTotal(0)
        setIgv(0)   
    }

    //para obtener la lista de sugerencias
    const onSuggestionsFetchRequested = ({ value }) => {

        const api = fetch("api/venta/Productos/" + value)
            .then((response) => {
                return response.ok ? response.json() : Promise.reject(response);
            })
            .then((dataJson) => {
                setA_Productos(dataJson)
            }).catch((error) => {
                console.log("No se pudo obtener datos, mayor detalle: ", error)
            })
        
    }

    //funcion que nos permite borrar las sugerencias
    const onSuggestionsClearRequested = () => {
        setA_Productos([])
    }

    //devuelve el texto que se mostrara en la caja de texto del autocomplete cuando seleccionas una sugerencia (item)
    const getSuggestionValue = (sugerencia) => {

        return sugerencia.codigo + " - " + sugerencia.marca + " - " + sugerencia.descripcion
    }

    //como se debe mostrar las sugerencias - codigo htmlf
    const renderSuggestion = (sugerencia) => (
        <span>
            {sugerencia.codigo + " - " + sugerencia.marca + " - " + sugerencia.descripcion}
        </span>
     )

    //evento cuando cambie el valor del texto de busqueda
    const onChange = (e, {newValue}) => {
        setA_Busqueda(newValue)
    }

    const inputProps = {
        placeholder : "Buscar producto",
        value: a_Busqueda,
        onChange
    }

    const sugerenciaSeleccionada = (event, { suggestion, suggestionValue, suggestionIndex, sectionIndex, method }) => {
        const isProductAlreadyAdded = productos.some((p) => p.idProducto === suggestion.idProducto);

        if (isProductAlreadyAdded) {
            Swal.fire("Opps!", "El producto ya ha sido agregado", "error");
            return;
        }

      Swal.fire({
        title: suggestion.marca + " - " + suggestion.descripcion,
          text: "Ingrese la cantidad",
          text: "La cantidad disponible de este producto es: " + suggestion.stock,
        input: 'text',
        inputAttributes: {
          autocapitalize: 'off'
        },
        showCancelButton: true,
        confirmButtonText: 'Aceptar',
        cancelButtonText: 'Volver',
        showLoaderOnConfirm: true,
        preConfirm: (inputValue) => {
          if (inputValue <= 0) {
            setA_Busqueda("");
            Swal.showValidationMessage("La cantidad debe ser mayor que 0");
            return;
          }

          if (isNaN(parseFloat(inputValue))) {
            setA_Busqueda("");
            Swal.showValidationMessage("Debe ingresar un valor numérico");
          } else {
            let cantidad = parseInt(inputValue);
            if (cantidad <= 0) {
              setA_Busqueda("");
              Swal.showValidationMessage("La cantidad debe ser mayor que 0");
              return;
            }

            if (cantidad > suggestion.stock) {
              setA_Busqueda("");
              Swal.showValidationMessage("La cantidad ingresada supera el stock disponible");
              return;
            }

              let producto = {
                  idProducto: suggestion.idProducto,
                  descripcion: suggestion.descripcion,
                  cantidad: cantidad,
                  precio: suggestion.precio,
                  total: suggestion.precio * parseFloat(inputValue),
                  stock: cantidad, // Modificar esta línea
              };

              let arrayProductos = [...productos, producto];
              setProductos(arrayProductos);
              calcularTotal(arrayProductos);
          }
        },
        allowOutsideClick: () => !Swal.isLoading()

      }).then((result) => {
        if (result.isConfirmed) {
          setA_Busqueda("");
        } else {
          setA_Busqueda("");
        }
      });
    };


    const eliminarProducto = (id) => {

        let listaproductos = productos.filter(p => p.idProducto != id)

        setProductos(listaproductos)

        calcularTotal(listaproductos)
    }

    const calcularTotal = (arrayProductos) => {
        let t = 0;
        let st = 0;
        let imp = 0;

        if (arrayProductos.length > 0) {

            arrayProductos.forEach((p) => {
                t = p.total + t
            })

            st = t / (1.16)
            imp = t - st
        }

        //Monto Base = (Monto con IVA) / (1.16)

        //IVA = (Monto con IVA) – (Monto Base)

        setSubTotal(st.toFixed(2))
        setIgv(imp.toFixed(2))
        setTotal(t.toFixed(2))
    }

    const terminarVenta = () => {

        if (productos.length < 1) {
            Swal.fire("Opps!", "No existen productos", "error");
            return;
        }

        if (!documentoCliente.trim()) {
            Swal.fire("Opps!", "El campo Nro de Documento es requerido", "error");
            return;
        }

        if (!nombreCliente.trim()) {
            Swal.fire("Opps!", "El campo Nombre es requerido", "error");
            return;
        }

        // Validación del campo Nro de Documento
        const documentoRegex = /^[VEJvej][0-9]{7,}$/;
        if (!documentoRegex.test(documentoCliente)) {
            Swal.fire(
                "Opps!",
                "El campo Nro de Documento no cumple con el formato requerido",
                "error"
            );
            return;
        }

        if (productos.length < 1) {
            Swal.fire(
                'Opps!',
                'No existen productos',
                'error'
            )
            return
        }

        let venta = {
            documentoCliente: documentoCliente,
            nombreCliente: nombreCliente,
            tipoDocumento: tipoDocumento,
            idUsuario: JSON.parse(user).idUsuario,
            subTotal: parseFloat(subTotal),
            igv: parseFloat(igv),
            total:parseFloat(total),
            listaProductos: productos
        }


        const api = fetch("api/venta/Registrar", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json;charset=utf-8'
            },
            body: JSON.stringify(venta)
        })
        .then((response) => {
            return response.ok ? response.json() : Promise.reject(response);
        })
        .then((dataJson) => {
            reestablecer();
            var data = dataJson;
            Swal.fire(
                'Venta Creada!',
                'Numero de venta : ' + data.numeroDocumento,
                'success'
            )

        }).catch((error) => {
            Swal.fire(
                'Opps!',
                'No se pudo crear la venta',
                'error'
            )
            console.log("No se pudo enviar la venta ", error)
        })

    }

    const modificarCantidad = (id) => {
        const producto = productos.find((p) => p.idProducto === id);

        if (producto) {
            Swal.fire({
                title: `${producto.descripcion}`,
                text: "Ingrese la nueva cantidad",
                text: "La cantidad disponible es: " + producto.cantidad,
                input: "text",
                inputAttributes: {
                    autocapitalize: "off",
                },
                showCancelButton: true,
                confirmButtonText: "Aceptar",
                cancelButtonText: "Cancelar",
                showLoaderOnConfirm: true,
                preConfirm: (inputValue) => {
                    if (isNaN(parseInt(inputValue))) {
                        Swal.showValidationMessage("Debe ingresar un valor numérico");
                    } else {
                        const nuevaCantidad = parseInt(inputValue);
                        if (nuevaCantidad <= 0) {
                            Swal.showValidationMessage("La cantidad debe ser mayor que cero");
                        } else if (nuevaCantidad > producto.stock) {
                            Swal.showValidationMessage("La cantidad ingresada supera el stock disponible");
                        } else {
                            const nuevoTotal = nuevaCantidad * producto.precio;

                            const productoInventario = a_Productos.find((p) => p.idProducto === id);
                            if (productoInventario) {
                                // Calcular la diferencia de cantidad
                                const diferenciaCantidad = nuevaCantidad - producto.cantidad;

                                // Actualizar la cantidad en existencia del producto en el inventario
                                productoInventario.stock -= diferenciaCantidad;
                            }

                            // Actualizar la cantidad y el total del producto en la lista de productos de la venta
                            const nuevosProductos = productos.map((p) => {
                                if (p.idProducto === id) {
                                    return { ...p, cantidad: nuevaCantidad, total: nuevoTotal };
                                }
                                return p;
                            });

                            setProductos(nuevosProductos);
                            calcularTotal(nuevosProductos);
                        }
                    }
                },
                allowOutsideClick: () => !Swal.isLoading(),
            });
        }
    };

    

    return (
        <Row>
            <Col sm={8}>

                <Row className="mb-2">
                    <Col sm={12}>
                        <Card>
                            <CardHeader style={{ backgroundColor: '#4e73df', color: "white" }}>
                                Cliente
                            </CardHeader>
                            <CardBody>
                                <Row>
                                    <Col sm={6}>
                                        <FormGroup>
                                            <Label>Nro Documento</Label>
                                            <Input
                                                bsSize="sm"
                                                value={documentoCliente}
                                                onChange={(e) => setDocumentoCliente(e.target.value)}
                                                required
                                                pattern="^[VEJvej][0-9]{7,}$"
                                                title="El Nro de Documento debe comenzar con V, E o J, seguido de un número entre 900000 y 40000000"
                                                placeholder="Ejemplo: V28148935"
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col sm={6}>
                                        <FormGroup>
                                            <Label>Nombre</Label>
                                            <Input
                                                bsSize="sm"
                                                value={nombreCliente}
                                                onChange={(e) => setNombreCliente(e.target.value)}
                                                required
                                            />
                                        </FormGroup>
                                    </Col>
                                </Row>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
                <Row>
                    <Col sm={12}>
                        <Card>
                            <CardHeader style={{ backgroundColor: '#4e73df', color: "white" }}>
                                Productos
                            </CardHeader>
                            <CardBody>
                                <Row className="mb-2">
                                    <Col sm={12}>
                                        <FormGroup>
                                            <Autosuggest
                                                suggestions={a_Productos}
                                                onSuggestionsFetchRequested={onSuggestionsFetchRequested}
                                                onSuggestionsClearRequested={onSuggestionsClearRequested}
                                                getSuggestionValue={getSuggestionValue}
                                                renderSuggestion={renderSuggestion}
                                                inputProps={inputProps}
                                                onSuggestionSelected={sugerenciaSeleccionada}
                                            />
                                        </FormGroup>
                                    </Col>
                                </Row>
                                <Row>
                                    <Col sm={12}>
                                        <Table striped size="sm">
                                            <thead>
                                                <tr>
                                                    <th></th>
                                                    <th>Producto</th>
                                                    <th>Cantidad</th>
                                                    <th>Precio</th>
                                                    <th>Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {
                                                    (productos.length < 1) ? (
                                                        <tr>
                                                            <td colSpan="5">Sin productos</td>
                                                        </tr>
                                                    ) :
                                                    (
                                                        productos.map((item) => (
                                                            <tr key={item.idProducto}>
                                                                <td>
                                                                    <Button
                                                                        color="danger"
                                                                        size="sm"
                                                                        onClick={() => eliminarProducto(item.idProducto)}
                                                                    >
                                                                        <i className="fas fa-trash-alt"></i>
                                                                    </Button>
                                                                </td>
                                                                <td>{item.descripcion}</td>
                                                                <td>{item.cantidad}</td>
                                                                <td>{item.precio}</td>
                                                                <td>{item.total}</td>
                                                                <td>
                                                                    <Button
                                                                        color="primary"
                                                                        size="sm"
                                                                        onClick={() => modificarCantidad(item.idProducto)}
                                                                    >
                                                                        <i className="fas fa-pencil-alt"></i>
                                                                    </Button>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )

                                                    
                                                }
                                            </tbody>
                                        </Table>
                                    </Col>
                                    
                                </Row>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </Col>

            <Col sm={4}>
                <Row className="mb-2">
                    <Col sm={12}>
                        <Card>
                            <CardHeader style={{ backgroundColor: '#4e73df', color: "white" }}>
                                Detalle
                            </CardHeader>
                            <CardBody>
                                <Row className="mb-2">
                                    <Col sm={12}>
                                        <InputGroup size="sm" >
                                            <InputGroupText>Tipo:</InputGroupText>
                                            <Input type="select" value={tipoDocumento} onChange={ (e) => setTipoDocumento(e.target.value)}>
                                                <option value="Credito">Nota de debito</option>
                                                <option value="Factura">Factura</option>
                                            </Input>
                                        </InputGroup>
                                    </Col>
                                </Row>
                                <Row className="mb-2">
                                    <Col sm={12}>
                                        <InputGroup size="sm" >
                                            <InputGroupText>Sub Total:</InputGroupText>
                                            <Input disabled value={subTotal} />
                                        </InputGroup>
                                    </Col>
                                </Row>
                                <Row className="mb-2">
                                    <Col sm={12}>
                                        <InputGroup size="sm" >
                                            <InputGroupText>IVA (16%):</InputGroupText>
                                            <Input disabled value={igv} />
                                        </InputGroup>
                                    </Col>
                                </Row>
                                <Row>
                                    <Col sm={12}>
                                        <InputGroup size="sm" >
                                            <InputGroupText>Total:</InputGroupText>
                                            <Input disabled value={total} />
                                        </InputGroup>
                                    </Col>
                                </Row>
                                
                                
                                
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
                <Row>
                    <Col sm={12}>
                        <Card>
                            <CardBody>
                                <Button color="success" block onClick={terminarVenta} >
                                    <i className="fas fa-money-check"></i> Terminar Venta</Button>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </Col>
        </Row>
    )
}

export default Venta;
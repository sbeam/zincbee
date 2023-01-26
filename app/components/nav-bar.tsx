import { Menubar } from 'primereact/menubar';

const NavBar = ({toggleOrderForm} : {toggleOrderForm : Function}) => {
  const menuItems = [
    {
      label:'Zincbee',
      icon:'pi pi-fw pi-file',
    }
  ]

  const orderFormSlider = <i onClick={(_e) => toggleOrderForm()} className="pi pi-angle-double-right" style={{'fontSize': '2em'}} />
  return (
    <Menubar model={menuItems} start={orderFormSlider} />
  )
}

export default NavBar

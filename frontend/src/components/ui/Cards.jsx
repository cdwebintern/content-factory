const Card = ({className='',children}) => {
  return (
    <section
      className={`rounded-3xl border border-glass-line bg-glass/70 p-5 shadow-card backdrop-blur-xl
                  transition hover:-translate-y-0.5 ${className}`}
    >
      {children}
    </section>
  )

}


export default Card;
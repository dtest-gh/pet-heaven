db.pets.insertMany([
    { name: "Whiskers", image: "/images/cat1.jpg", breed: "Ginger Cat", age:"4 months"},
    { name: "Quincy", image: "/images/quincy.jpg", breed: "Cavalier King Charles Spaniel", age: "3 months"  },
    { name: "Mittens", image: "/images/cat2.jpg", breed: "Tabby Cat", age:"1 year" },
    { name: "Sunny", image: "/images/sunny.jpg", breed: "Golden Retriever", age: "4 months" },
    { name: "Shadow", image: "/images/cat3.jpg", breed:"Black Cat", age:"2 years" },
    { name: "Rex", image: "/images/rex.jpg", breed: "German Shepherd", age: "2 years" },
    { name: "Miso", image: "/images/miso.jpg", breed: "Pembroke Welsh Corgi", age:"1 year" },
    { name: "Snowy", image: "/images/snowy.jpg", breed:"White Longhair Cat", age:"3 years" },
    { name: "Hero", image: "/images/hero.jpg", breed:"Black Labrador Retriever", age:"1 year" }
]);

print("Pets successfully seeded!");

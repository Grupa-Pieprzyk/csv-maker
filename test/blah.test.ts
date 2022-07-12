import { toCSV, flattenRenderer, Config, getRow, Column } from '../src';

type Elderliness = 'puppy' | 'adult' | 'elder' | 'dead';
type Happiness = 'happy' | 'ok' | 'sad';
type Dog = {
  name: string;
  years: {
    elderliness: Record<number, Elderliness>;
    happiness: Record<number, Happiness>;
  }
}

const EXAMPLE_DOG: Dog = {

  name: 'Doggo',
  years: { elderliness: { 2021: 'puppy' }, happiness: { 2021: 'happy' } }
}

const TEST_DATA: Dog[] = [
  EXAMPLE_DOG
]

function uniq<T>(collection: T[]): T[] {
  const alreadyThere: T[] = [];
  for (let element of collection) {
    if (alreadyThere.includes(element)) continue;
    alreadyThere.push(element);
  }
  return alreadyThere;
}

describe('csv rendering', () => {
  it('works for simple stuff', () => {
    expect(toCSV(TEST_DATA, {
      columns: [
        { text: 'name', child: { fn: (dog) => dog.name } }
      ]
    })).toStrictEqual([
      ['name'],
      ['Doggo']
    ])
  });

  const yearConfig = (year: number): Column<Dog> => ({
    text: year.toString(), child: [
      { text: 'happiness', child: { fn: (dog: Dog) => dog.years.happiness[year] ?? null } },
      { text: 'elderliness', child: { fn: (dog: Dog) => dog.years.elderliness[year] ?? null } },
    ]
  });

  const nestedConfig = (): Config<Dog> => {
    const years: number[] = uniq(TEST_DATA.flatMap((dog) => Object.values(dog.years).flatMap((parameter) => Object.keys(parameter).map((v) => parseInt(v)))));
    console.log({ years });
    return {
      columns: [
        { text: 'name', child: { fn: (dog) => dog.name } },
        ...years.map(yearConfig)
      ]
    };
  }
  it('single row works with nested config', () => {
    expect(getRow(EXAMPLE_DOG, nestedConfig())).toStrictEqual(['Doggo', 'happy', 'puppy'])
  })
  it('typescript typechecking works', () => {
    const flattened = flattenRenderer<Dog>(yearConfig(2021));
    expect(flattened.length).toEqual(2);
    expect(flattened[0]).not.toBeNull();
    expect(flattened[0].text).toEqual('happiness');
    expect(flattened[0].child).not.toHaveProperty('length'); // not to be an array
  })

  it('works for more complex stuff', () => {
    const rendered = toCSV(TEST_DATA, nestedConfig());
    expect(rendered).toStrictEqual([
      [null, '2021', '2021'],
      ['name', 'happiness', 'elderliness'],
      ['Doggo', 'happy', 'puppy']
    ])
  })
});

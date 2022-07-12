import { toCSV, flattenRenderer } from '../src';

type Elderliness = 'puppy' | 'adult' | 'elder' | 'dead';
type Happyness = 'happy' | 'ok' | 'sad';
type Dog = {
  name: string;
  years: {
    elderliness: Record<string, Elderliness>;
    happyness: Record<string, Happyness>;
  }
}

const data: Dog[] = [
  {
    name: 'Doggo',
    years: { elderliness: { '2021': 'puppy' }, happyness: { '2021': 'happy' } }
  }
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
    expect(toCSV(data, {
      columns: [
        { text: 'name', child: (dog) => dog.name }
      ]
    })).toStrictEqual([
      ['name'],
      ['Doggo']
    ])
  });

  it('typescript typechecking works', () => {
    const year = '2021';
    const flattened = flattenRenderer<Dog>({
      text: year, child: [
        { text: 'happiness', child: (dog: Dog) => dog.years.happyness[year] ?? null },
        { text: 'elderliness', child: (dog: Dog) => dog.years.elderliness[year] ?? null },
      ]
    });
    expect(flattened[0]).not.toBeNull();
    expect(flattened[0].text).toEqual('happiness');
    expect(flattened[0].child).not.toHaveProperty('length'); // not to be an array
  })

  it('works for more complex stuff', () => {
    expect(toCSV(data, {
      columns: [
        { text: 'name', child: (dog) => dog.name },
        ...uniq(data.flatMap((dog) => Object.keys(dog.years))).map((year) => ({
          text: year, child: [
            { text: 'happiness', child: (dog: Dog) => dog.years.happyness[year] ?? null },
            { text: 'elderliness', child: (dog: Dog) => dog.years.elderliness[year] ?? null },
          ]
        }))
      ]
    })).toStrictEqual([
      [null, '2021', null],
      ['name', 'happiness', 'elderliness'],
      ['Doggo', 'happy', 'puppy']

    ])
  })
});

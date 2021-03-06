import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { map, Observable } from 'rxjs';

import { FavoritesService } from '../favorites/favorites.service';
import { pokemonTypes } from '../consts';
import { IPokemonResponse } from '../interfaces/pokemon-responce-inteface';
import { IPokemon } from '../interfaces/pokemon-interface';

@Injectable()
export class PokemonsService {

  constructor(private httpService: HttpService, private favoritesService: FavoritesService) {
  }

  baseURL = 'https://pokeapi.co/api/v2/';

  async getAllPokemons(offset: string, limit: string, name: string): Promise<Observable<IPokemonResponse>> {
    let selfOffset = offset;
    let selflimit = limit;

    if (name) {
      const response = await this.httpService.get(this.baseURL + 'pokemon?limit=1&offset=1').toPromise();

      selfOffset = '0';
      selflimit = response.data.count;
    }

    return this.httpService.get(this.baseURL + 'pokemon?offset=' + selfOffset + '&limit=' + selflimit).pipe(
      map(response => {
        let pokemons = [];
        let count = 0;
        const findPokemons = [];
        for (const index in response.data.results) {
          if (name) {
            if (response.data.results[index].name.search(name) !== -1) {
              findPokemons.push(response.data.results[index].name);
            }
          } else {
            pokemons.push(response.data.results[index].name);
          }
        }
        count = response.data.count;
        if (name) {
          pokemons = findPokemons.slice(Number.parseInt(offset, 10), Number.parseInt(limit, 10) + Number.parseInt(offset, 10));
          count = findPokemons.length;
        }

        return {
          count,
          pokemons
        };
      })
    );
  }

  async getAllPokemonsByFilter(offset: string, limit: string, types: string[], name: string): Promise<IPokemonResponse> {
    const correctTypes = pokemonTypes;
    let filtredPokemons: string[] = [];
    const pokemonsByTypes: string[][] = [];
    const uniqTypes = [...new Set(types)];

    for (const index in uniqTypes) {
      const type = uniqTypes[index].toLowerCase();
      if (correctTypes.includes(type)) {
        const response = await this.httpService.get(this.baseURL + 'type/' + type).toPromise();
        const correctPokemons = response.data.pokemon;
        const pokemonsByType: string[] = [];
        for (const i in correctPokemons) {
          pokemonsByType.push(correctPokemons[i].pokemon.name);
        }
        pokemonsByTypes.push(pokemonsByType);
      }
    }

    for (let i = 1; i < pokemonsByTypes.length; i++) {
      pokemonsByTypes[i] = pokemonsByTypes[i - 1].filter(pokemonName => pokemonsByTypes[i].includes(pokemonName));
    }

    filtredPokemons = pokemonsByTypes[pokemonsByTypes.length - 1];

    if (name) {
      filtredPokemons = filtredPokemons.filter(pokemonName => pokemonName.search(name) !== -1);
    }

    const slicedPokemonsList = filtredPokemons.slice(Number.parseInt(offset, 10), Number.parseInt(limit, 10) + Number.parseInt(offset, 10));

    return {
      count: filtredPokemons.length,
      pokemons: slicedPokemonsList
    }
  }

  async getPokemonByName(name: string, userId: number): Promise<Observable<IPokemon>> {
    const favoritePokemons: string[] = await this.favoritesService.getAllFavoritePokemons(userId);
    const trimmedName = name.trim();

    return this.httpService.get(this.baseURL + 'pokemon/' + trimmedName).pipe(
      map(response => {
        const stats = [];
        const types = [];
        let isFavorite = false;

        for (const index in response.data.stats) {
          stats.push({
            name: response.data.stats[index].stat.name,
            point: response.data.stats[index].base_stat
          });
        }

        for (const index in response.data.types) {
          types.push(response.data.types[index].type.name);
        }

        if (favoritePokemons.includes(trimmedName)) {
          isFavorite = true;
        }

        return {
          name: trimmedName,
          img: response.data.sprites.front_default,
          stats,
          types,
          isFavorite
        };
      })
    );
  }

}
